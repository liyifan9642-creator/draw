/**
 * useVoiceAgent — mimo + Web Speech API 语音 Agent Hook
 *
 * V2.0 架构：完全替代 ElevenLabs，使用自有 API
 *
 * 流水线：
 *   用户说话 → Web Speech API (ASR) → 文本
 *            → mimo-v2.5-pro (LLM + Tool Calling) → 工具执行
 *            → Web Speech API (TTS) → 语音回复（可选）
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { initTools, getCanvasTools, setCanvasSize } from "@vdc/voice-agent";
import type { CanvasStore } from "@vdc/canvas-engine";
import { initMimoLlm, chat, resetConversation, isMimoLlmReady } from "../services/mimoLlm";
import { startAsr, stopAsr, isAsrSupported, isAsrListening } from "../services/browserAsr";
import { speak, stop as stopTts, isTtsPlaying } from "../services/browserTts";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

// ─── 类型 ────────────────────────────────────────────────────

export type AgentStatus = "disconnected" | "connecting" | "connected" | "listening" | "thinking" | "speaking";
export type AgentMode = "idle" | "listening" | "thinking" | "speaking";

export interface UseVoiceAgentOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  store: CanvasStore | null;
  canvasWidth?: number;
  canvasHeight?: number;
  /** 操作日志回调 */
  onLog?: (message: string, color?: string) => void;
  /** 是否启用 TTS 语音回复（默认 false） */
  enableTts?: boolean;
}

export interface UseVoiceAgentReturn {
  isListening: boolean;
  status: AgentStatus;
  mode: AgentMode;
  userTranscript: string;
  agentResponse: string;
  error: string | null;
  toggle: () => void;
  /** 停止 TTS 播放 */
  stopTts: () => void;
  /** 是否正在播放 TTS */
  isSpeaking: boolean;
}

// ─── 工具 Schema（与之前一致，省略重复部分） ──────────────────

function getToolSchemas(): ChatCompletionTool[] {
  return [
    {
      type: "function",
      function: {
        name: "generate_shape",
        description: "创建几何图形。使用 gridCoordinate 定位（如 x10y25），不要计算像素。",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["rect", "circle", "triangle", "ellipse", "line"] },
            gridCoordinate: { type: "string", description: '网格坐标，如 "x10y25"' },
            width: { type: "number" }, height: { type: "number" }, radius: { type: "number" },
            fill: { type: "string" }, stroke: { type: "string" }, strokeWidth: { type: "number" },
            rotation: { type: "number" }, name: { type: "string" },
          },
          required: ["type"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "align_objects",
        description: "对齐两个图形。当用户说'紧贴右侧'、'对齐'等相对位置关系时使用。",
        parameters: {
          type: "object",
          properties: {
            targetNodeId: { type: "string" }, referenceNodeId: { type: "string" },
            relation: { type: "string", enum: ["leftOf", "rightOf", "alignTop", "alignCenter"] },
            offset: { type: "number" },
          },
          required: ["targetNodeId", "referenceNodeId", "relation"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "generate_template",
        description: "生成复杂图形模板。支持参数化控制形态、表情、配饰等细节。",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", description: "模板名，如 cat, dog, tree, house, person, star, heart 等" },
            gridCoordinate: { type: "string", description: '网格坐标，如 "x25y25"' },
            size: { type: "number", description: "尺寸（直径），默认 100" },
            fill: { type: "string" }, stroke: { type: "string" }, strokeWidth: { type: "number" },
            rotation: { type: "number" }, name: { type: "string" },
            bodyWidth: { type: "number", description: "身体宽度比例，0.5=瘦, 1.0=正常, 2.0=胖" },
            headSize: { type: "number", description: "头部大小比例，0.5-2.0" },
            earSize: { type: "number", description: "耳朵大小比例，0.5-2.0" },
            tailLength: { type: "number", description: "尾巴长度比例，0.5-2.0" },
            facing: { type: "string", enum: ["front", "left", "right", "back"], description: "朝向" },
            canopySize: { type: "number", description: "树冠大小比例（树模板），0.5-2.0" },
            trunkWidth: { type: "number", description: "树干粗细比例（树模板），0.5-2.0" },
            roofHeight: { type: "number", description: "屋顶高度比例（房子模板），0.5-2.0" },
            doorSize: { type: "number", description: "门大小比例（房子模板），0.5-2.0" },
            eyeShape: { type: "string", enum: ["round", "slit", "closed", "happy"], description: "眼睛形状：round=圆眼, slit=竖瞳, closed=闭眼, happy=笑眼" },
            mouthStyle: { type: "string", enum: ["smile", "neutral", "open", "frown"], description: "嘴巴样式" },
            tongueOut: { type: "boolean", description: "是否伸出舌头（狗模板）" },
            hasSpots: { type: "boolean", description: "是否有斑点（狗模板）" },
            whiskers: { type: "boolean", description: "是否有胡须（猫模板）" },
            expression: { type: "string", enum: ["happy", "sad", "neutral", "surprised", "angry"], description: "人物表情" },
            hairStyle: { type: "string", enum: ["short", "long", "bald", "ponytail"], description: "人物发型" },
            accessories: { type: "string", enum: ["glasses", "hat", "scarf", "none"], description: "人物配饰" },
            tailStyle: { type: "string", enum: ["up", "down", "curly"], description: "尾巴姿态（狗模板）" },
          },
          required: ["template"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "generate_svg",
        description: "单次 SVG 全量生成。用于画复杂有机形状（动物、人物、食物等）。一次性输出完整的 SVG Path 数据，不要拆分多次调用。画布坐标系 500x500 像素。",
        parameters: {
          type: "object",
          properties: {
            pathData: { type: "string", description: "完整的 SVG Path 数据，用 M/L/Q/C/A/Z 命令。如 M250,400 C200,380..." },
            fill: { type: "string", description: "填充色，如 yellow, #FFD700" },
            stroke: { type: "string", description: "描边色" },
            strokeWidth: { type: "number", description: "描边宽度" },
            gridCoordinate: { type: "string", description: '放置位置，如 "x25y25"' },
            name: { type: "string", description: "图形名称" },
          },
          required: ["pathData"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "search_icon",
        description: "语义搜索矢量图标。100+ 常用图标（搜索、锁、相机、邮件、音乐、设置、用户、心、星等）。支持中英文关键词。",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: '搜索关键词，如 "搜索"、"锁"、"camera"、"heart"' },
            gridCoordinate: { type: "string", description: '放置位置，如 "x25y25"' },
            size: { type: "number", description: "图标大小（像素），默认 100" },
            fill: { type: "string" }, stroke: { type: "string" }, strokeWidth: { type: "number" },
            name: { type: "string" },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "generate_image", description: "生成 AI 图像",
        parameters: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            style: { type: "string", enum: ["realistic", "cartoon", "anime", "oil_painting", "watercolor", "pixel_art", "sketch", "cyberpunk"] },
            position: { type: "string", enum: ["center", "top-left", "top-right", "bottom-left", "bottom-right"] },
            width: { type: "number" }, height: { type: "number" },
          },
          required: ["prompt"],
        },
      },
    },
    {
      type: "function", function: {
        name: "modify_node",
        description: "修改已有图形的属性。用于语音微调：放大/缩小/移动/变色/旋转。target 使用节点 name（如 '猫'）。",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "节点名称（如 '猫'、'树'）或 ID" },
            updates: {
              type: "object",
              description: "要更新的属性",
              properties: {
                x: { type: "number", description: "x 坐标（左移减小，右移增大）" },
                y: { type: "number", description: "y 坐标（上移减小，下移增大）" },
                scaleX: { type: "number", description: "水平缩放（1.3=放大30%，0.7=缩小30%）" },
                scaleY: { type: "number", description: "垂直缩放" },
                rotation: { type: "number", description: "旋转角度（度）" },
                fill: { type: "string", description: "填充颜色" },
                stroke: { type: "string", description: "描边颜色" },
                opacity: { type: "number", description: "透明度（0-1）" },
              },
            },
          },
          required: ["target", "updates"],
        },
      },
    },
    {
      type: "function", function: {
        name: "delete_node", description: "删除节点",
        parameters: { type: "object", properties: { target: { type: "string" } }, required: ["target"] },
      },
    },
    {
      type: "function", function: {
        name: "move_node", description: "移动节点",
        parameters: { type: "object", properties: { target: { type: "string" }, x: { type: "number" }, y: { type: "number" } }, required: ["target", "x", "y"] },
      },
    },
    {
      type: "function", function: {
        name: "set_canvas_background", description: "设置背景色",
        parameters: { type: "object", properties: { color: { type: "string" } }, required: ["color"] },
      },
    },
    {
      type: "function", function: {
        name: "add_text", description: "添加文本",
        parameters: { type: "object", properties: { text: { type: "string" }, gridCoordinate: { type: "string" }, fontSize: { type: "number" }, fill: { type: "string" }, name: { type: "string" } }, required: ["text"] },
      },
    },
    {
      type: "function", function: {
        name: "undo_action", description: "撤销",
        parameters: { type: "object", properties: { steps: { type: "number" } } },
      },
    },
    {
      type: "function", function: {
        name: "redo_action", description: "重做",
        parameters: { type: "object", properties: { steps: { type: "number" } } },
      },
    },
    {
      type: "function", function: {
        name: "clear_canvas", description: "清空画布",
        parameters: { type: "object", properties: { confirm: { type: "boolean" } } },
      },
    },
    {
      type: "function", function: {
        name: "query_canvas_state", description: "查询画布状态",
        parameters: { type: "object", properties: {} },
      },
    },
  ];
}

// ─── Hook ────────────────────────────────────────────────────

export function useVoiceAgent({
  apiKey,
  baseUrl,
  model,
  store,
  canvasWidth = 1000,
  canvasHeight = 600,
  onLog,
  enableTts = false,
}: UseVoiceAgentOptions): UseVoiceAgentReturn {
  const [status, setStatus] = useState<AgentStatus>("disconnected");
  const [mode, setMode] = useState<AgentMode>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [agentResponse, setAgentResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const storeRef = useRef<CanvasStore | null>(store);
  const isProcessingRef = useRef(false);
  const onLogRef = useRef(onLog);
  const enableTtsRef = useRef(enableTts);

  // 同步 ref
  useEffect(() => { onLogRef.current = onLog; }, [onLog]);
  useEffect(() => { enableTtsRef.current = enableTts; }, [enableTts]);

  useEffect(() => {
    storeRef.current = store;
    if (store) {
      initTools(store);
      setCanvasSize(canvasWidth, canvasHeight);
    }
  }, [store, canvasWidth, canvasHeight]);

  /** 工具执行器 — 带日志 */
  const executeTool = useCallback(
    (name: string, args: Record<string, unknown>): string => {
      if (!storeRef.current) {
        const msg = "画布未初始化";
        onLogRef.current?.(`❌ ${name} → ${msg}`, "#F44336");
        return JSON.stringify({ success: false, errorMessage: msg });
      }

      // 确保工具上下文已初始化
      initTools(storeRef.current);
      setCanvasSize(canvasWidth, canvasHeight);

      const canvasTools = getCanvasTools();
      const toolFn = canvasTools[name];
      if (!toolFn) {
        const msg = `未知工具: ${name}`;
        onLogRef.current?.(`❌ ${name} → ${msg}`, "#F44336");
        return JSON.stringify({ success: false, errorMessage: msg });
      }

      try {
        const resultStr = toolFn(args);
        const result = JSON.parse(resultStr);

        // 记录操作日志
        const log = onLogRef.current;
        if (log) {
          if (result.success) {
            log(`🎙️ ${name} → ${result.message ?? "成功"}`, "#4CAF50");
          } else {
            const reason = result.errorMessage || result.message || JSON.stringify(result);
            log(`❌ ${name} → ${reason}`, "#F44336");
          }
        }

        return resultStr;
      } catch (err) {
        const errMsg = `${name} 执行异常: ${err instanceof Error ? err.message : String(err)}`;
        onLogRef.current?.(`💥 ${errMsg}`, "#F44336");
        return JSON.stringify({ success: false, errorMessage: errMsg });
      }
    },
    [canvasWidth, canvasHeight]
  );

  /** 处理用户输入 → LLM → 工具执行 → 可选 TTS */
  const processInput = useCallback(
    async (text: string) => {
      if (isProcessingRef.current || !storeRef.current) return;
      isProcessingRef.current = true;

      setUserTranscript(text);
      setStatus("thinking");
      setMode("thinking");
      setError(null);
      onLogRef.current?.(`🗣️ "${text}"`, "#2196F3");

      try {
        const response = await chat(text, getToolSchemas(), executeTool, 5);

        setAgentResponse(response.content);

        // 记录 LLM 回复
        if (response.content) {
          onLogRef.current?.(`🤖 ${response.content}`, "#9C27B0");
        }

        // 可选 TTS
        if (enableTtsRef.current && response.content) {
          setStatus("speaking");
          setMode("speaking");
          setSpeaking(true);

          await new Promise<void>((resolve) => {
            speak(response.content, {
              onEnd: () => { setSpeaking(false); resolve(); },
              onError: () => { setSpeaking(false); resolve(); },
            }, { rate: 1.3 }); // 加速 30%
          });
        }

        // 回到监听状态
        if (isAsrListening()) {
          setStatus("listening");
          setMode("listening");
        } else {
          setStatus("connected");
          setMode("idle");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "处理失败";
        setError(msg);
        onLogRef.current?.(`💥 LLM 错误: ${msg}`, "#F44336");
        setStatus("connected");
        setMode("idle");
      } finally {
        isProcessingRef.current = false;
      }
    },
    [executeTool]
  );

  const startListening = useCallback(async () => {
    if (!storeRef.current) { setError("画布尚未初始化"); return; }

    if (!isMimoLlmReady()) {
      try { initMimoLlm({ apiKey, baseUrl, model }); }
      catch { setError("LLM 初始化失败"); return; }
    }

    if (!isAsrSupported()) {
      setError("当前浏览器不支持语音识别，请使用 Chrome 或 Edge");
      return;
    }

    setError(null);
    setStatus("connecting");
    resetConversation();
    onLogRef.current?.("🎙️ 语音监听已开启", "#4CAF50");

    startAsr({
      onResult: (text, isFinal) => {
        if (isFinal && text.trim()) {
          processInput(text.trim());
        } else {
          setUserTranscript(text);
        }
      },
      onError: (errMsg) => { setError(errMsg); setStatus("connected"); },
      onStateChange: (state) => {
        if (state === "listening") { setStatus("listening"); setMode("listening"); }
      },
    }, "zh-CN");
  }, [apiKey, baseUrl, model, processInput]);

  const stopListening = useCallback(() => {
    stopAsr();
    stopTts();
    setSpeaking(false);
    setStatus("disconnected");
    setMode("idle");
    isProcessingRef.current = false;
    onLogRef.current?.("🎙️ 语音监听已关闭", "#9E9E9E");
  }, []);

  const handleStopTts = useCallback(() => {
    stopTts();
    setSpeaking(false);
    if (isAsrListening()) {
      setStatus("listening");
      setMode("listening");
    } else {
      setStatus("connected");
      setMode("idle");
    }
  }, []);

  const toggle = useCallback(() => {
    if (status === "disconnected") startListening();
    else stopListening();
  }, [status, startListening, stopListening]);

  useEffect(() => { return () => { stopAsr(); stopTts(); }; }, []);

  return {
    isListening: status === "listening" || status === "thinking" || status === "speaking",
    status, mode, userTranscript, agentResponse, error,
    toggle,
    stopTts: handleStopTts,
    isSpeaking: speaking,
  };
}
