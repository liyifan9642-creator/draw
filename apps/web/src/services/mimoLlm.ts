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
4. 回复要简洁，告知用户执行了什么操作
5. 颜色使用英文名称或十六进制值

【语音微调】用户修改已有图形时，使用 modify_node 工具：
- "把猫放大一点" → modify_node({ target: "猫", updates: { scaleX: 1.3, scaleY: 1.3 } })
- "把猫缩小" → modify_node({ target: "猫", updates: { scaleX: 0.7, scaleY: 0.7 } })
- "猫往左移" → modify_node({ target: "猫", updates: { x: 当前x - 30 } })
- "猫往右移" → modify_node({ target: "猫", updates: { x: 当前x + 30 } })
- "猫往上移" → modify_node({ target: "猫", updates: { y: 当前y - 30 } })
- "猫变红色" → modify_node({ target: "猫", updates: { fill: "red" } })
- "猫旋转45度" → modify_node({ target: "猫", updates: { rotation: 45 } })
- "删除猫" → delete_node({ target: "猫" })
注意：target 使用节点的 name（如 "猫"），不是 id。先用 query_canvas_state 查询当前节点位置，再计算新位置。

【场景组合】用户描述场景时，拆解为多个元素，依次创建，再用 align_objects 对齐。
步骤：1. 分析场景需要哪些元素 2. 用 gridCoordinate 初步定位 3. 用 align_objects 精确对齐

示例——"画一只猫坐在树下"：
1. generate_template({ template: "tree", gridCoordinate: "x25y15", size: 200, name: "树" })
2. generate_template({ template: "cat", gridCoordinate: "x25y35", size: 120, name: "猫" })
3. align_objects({ targetNodeId: "猫", referenceNodeId: "树", relation: "alignCenter" })

示例——"画一个房子旁边有一棵树"：
1. generate_template({ template: "house", gridCoordinate: "x20y25", size: 180, name: "房子" })
2. generate_template({ template: "tree", gridCoordinate: "x38y25", size: 160, name: "树" })

示例——"画一只狗追一只猫"：
1. generate_template({ template: "cat", gridCoordinate: "x35y30", size: 100, facing: "left", name: "猫" })
2. generate_template({ template: "dog", gridCoordinate: "x18y30", size: 120, facing: "right", tongueOut: true, name: "狗" })

示例——"画一个太阳和云"：
1. generate_template({ template: "sun", gridCoordinate: "x40y10", size: 120, name: "太阳" })
2. generate_template({ template: "cloud", gridCoordinate: "x15y12", size: 100, name: "云" })

示例——"画一群人"：
1. generate_template({ template: "person", gridCoordinate: "x15y30", size: 80, name: "人1" })
2. generate_template({ template: "person", gridCoordinate: "x25y30", size: 80, expression: "happy", name: "人2" })
3. generate_template({ template: "person", gridCoordinate: "x35y30", size: 80, accessories: "hat", name: "人3" })

【工具选择】
A. 模板列表中有对应模板 → 使用 generate_template（矢量、高质量）
   参数化控制：bodyWidth(胖瘦), headSize(头), earSize(耳), tailLength(尾), facing(朝向)
   细粒度控制：eyeShape(round/slit/closed/happy), mouthStyle(smile/neutral/open/frown)
   猫模板：whiskers(胡须), eyeShape(竖瞳=slit)
   狗模板：tongueOut(伸舌), hasSpots(斑点), tailStyle(up/down/curly)
   人物模板：expression(happy/sad/surprised/angry), hairStyle(short/long/bald/ponytail), accessories(glasses/hat/scarf)
   例："画一只开心的胖猫" → generate_template({ template: "cat", bodyWidth: 1.5, eyeShape: "happy", mouthStyle: "smile" })
   例："画一只伸舌头的斑点狗" → generate_template({ template: "dog", tongueOut: true, hasSpots: true, tailStyle: "up" })
   例："画一个戴眼镜的人" → generate_template({ template: "person", accessories: "glasses" })
B. 简单几何图形（矩形、圆形、三角形）→ 使用 generate_shape（手绘风格）
C. 用户要画图标/符号 → 使用 search_icon（100+ 矢量图标，中英文搜索）
   例："画一个搜索图标" → search_icon({ query: "搜索" })
D. 模板和图标都没有的复杂事物 → 使用 generate_image（AI 生成简笔画）
   generate_image 的 prompt 用英文，简洁具体。如 "a cute robot", "a birthday cake"

可用模板列表（generate_template 工具）：
【动物】cat/猫, dog/狗, bird/鸟, fish/鱼, rabbit/兔子, butterfly/蝴蝶, horse/马, elephant/大象, lion/狮子, penguin/企鹅, owl/猫头鹰, frog/青蛙
【植物】tree/树, flower/花, mushroom/蘑菇
【自然】sun/太阳, mountain/山
【建筑】house/房子
【交通】car/汽车, boat/船, airplane/飞机, train/火车, bicycle/自行车, helicopter/直升机, rocket/火箭
【食物】apple/苹果, coffee_cup/咖啡, hamburger/汉堡, donut/甜甜圈, banana/香蕉, strawberry/草莓
【人物】person/人物
【物体】crown/皇冠, key/钥匙, flag/旗帜, robot/机器人, guitar/吉他, basketball/篮球, trophy/奖杯, gift/礼物, balloon/气球, umbrella/雨伞, hat/帽子
【符号】star/星星, heart/爱心, arrow/箭头, chat_bubble/对话框, hexagon/六边形, octagon/八边形, diamond/菱形, cross/十字, lightning/闪电, shield/盾牌, cloud/云朵, crescent/月亮, music_note/音符, infinity/无限, hash/井号`;

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
