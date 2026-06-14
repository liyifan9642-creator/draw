/**
 * mimo LLM Service — 基于 OpenAI 兼容 API 的工具调用
 *
 * 使用 mimo-v2.5-pro 模型，通过 OpenAI SDK 发送消息和工具定义，
 * 接收 tool_calls 响应并执行客户端工具。
 *
 * 架构：用户文本 → mimo LLM → tool_calls → 执行工具 → 结果回传 LLM → 最终回复
 */

import OpenAI from "openai";
import type { ChatCompletionTool, ChatCompletionMessageParam } from "openai/resources/chat/completions";

// ─── 配置 ────────────────────────────────────────────────────

const DEFAULT_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1";
const DEFAULT_MODEL = "mimo-v2.5-pro";

// ─── 类型 ────────────────────────────────────────────────────

export interface MimoLlmConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface ToolCallResult {
  toolCallId: string;
  functionName: string;
  arguments: string;
  result: string;
}

export interface LlmResponse {
  /** LLM 的文本回复 */
  content: string;
  /** LLM 请求调用的工具列表（可能为空） */
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  /** 是否需要执行工具调用 */
  needsToolExecution: boolean;
  /** 思考过程（mimo 特有） */
  reasoning?: string;
}

// ─── 客户端 ──────────────────────────────────────────────────

let _client: OpenAI | null = null;
let _model: string = DEFAULT_MODEL;
let _conversationHistory: ChatCompletionMessageParam[] = [];

/** 系统提示词 — 网格坐标系统 + 工具使用指南 */
const SYSTEM_PROMPT = `你面前的画布是一个 50x50 的网格。x轴从左到右(1-50)，y轴从上到下(1-50)。例如左上角是 x1y1，中心是 x25y25。

你是一个绘图助手，通过调用工具在画布上创建和操作图形。

规则：
1. 用户提到位置时，使用 gridCoordinate 参数（格式如 "x10y25"），不要计算像素
2. 用户提到相对位置关系（如"紧贴右侧"、"对齐"）时，使用 align_objects 工具
3. 使用 align_objects 时，需要先创建好两个图形，再调用对齐工具
4. 用户要画复杂图形（星星、爱心、箭头、盾牌、闪电、云朵、月亮等）时，使用 generate_template 工具
5. 回复要简洁，告知用户执行了什么操作
6. 颜色使用英文名称或十六进制值

可用模板列表（generate_template 工具）：
- star/星星/五角星: 五角星
- heart/爱心/心形: 爱心
- arrow/箭头: 右箭头
- chat_bubble/对话框/气泡: 对话气泡
- hexagon/六边形: 六边形
- octagon/八边形: 八边形
- diamond/菱形/钻石: 菱形
- cross/十字/加号: 十字架
- lightning/闪电: 闪电
- shield/盾牌: 盾牌
- cloud/云朵/云: 云朵
- crescent/月亮/新月: 新月
- music_note/音符: 音符
- infinity/无限/无穷: 无限符号
- hash/井号/#: 井号`;

/**
 * 初始化 mimo LLM 客户端
 */
export function initMimoLlm(config: MimoLlmConfig): void {
  const baseURL = config.baseUrl ?? DEFAULT_BASE_URL;

  _client = new OpenAI({
    apiKey: config.apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
  _model = config.model ?? DEFAULT_MODEL;
  _conversationHistory = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
}

/**
 * 清空对话历史（保留系统提示）
 */
export function resetConversation(): void {
  _conversationHistory = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
}

/**
 * 获取客户端实例
 */
function getClient(): OpenAI {
  if (!_client) {
    throw new Error("mimo LLM 未初始化，请先调用 initMimoLlm()");
  }
  return _client;
}

/**
 * 发送消息到 LLM 并获取响应（支持多轮工具调用）
 *
 * @param userMessage  用户输入文本
 * @param tools        可用工具的 Schema 定义
 * @param toolExecutor 工具执行函数（接收工具名和参数，返回结果字符串）
 * @param maxRounds    最大工具调用轮数（防止无限循环）
 */
export async function chat(
  userMessage: string,
  tools: ChatCompletionTool[],
  toolExecutor: (name: string, args: Record<string, unknown>) => string,
  maxRounds: number = 5
): Promise<LlmResponse> {
  const client = getClient();

  // 添加用户消息到历史
  _conversationHistory.push({ role: "user", content: userMessage });

  let finalContent = "";
  let finalReasoning: string | undefined;
  const allToolCalls: LlmResponse["toolCalls"] = [];

  // 多轮工具调用循环
  for (let round = 0; round < maxRounds; round++) {
    const response = await client.chat.completions.create({
      model: _model,
      messages: _conversationHistory,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error("mimo LLM 返回空响应");
    }

    const message = choice.message;
    finalContent = message.content ?? "";
    finalReasoning = (message as any).reasoning_content ?? undefined;

    // 检查是否有工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      // 将 assistant 消息添加到历史（包含 tool_calls）
      _conversationHistory.push({
        role: "assistant",
        content: message.content,
        tool_calls: message.tool_calls,
      } as any);

      // 执行每个工具调用
      for (const toolCall of message.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, unknown>;

        try {
          fnArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          fnArgs = {};
        }

        // 执行工具
        const result = toolExecutor(fnName, fnArgs);

        allToolCalls.push({
          id: toolCall.id,
          name: fnName,
          arguments: toolCall.function.arguments,
        });

        // 将工具结果添加到历史
        _conversationHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // 继续循环，让 LLM 根据工具结果生成回复
      continue;
    }

    // 没有工具调用，结束循环
    _conversationHistory.push({ role: "assistant", content: finalContent });
    break;
  }

  return {
    content: finalContent,
    toolCalls: allToolCalls,
    needsToolExecution: allToolCalls.length > 0,
    reasoning: finalReasoning,
  };
}

/**
 * 检查是否已初始化
 */
export function isMimoLlmReady(): boolean {
  return _client !== null;
}
