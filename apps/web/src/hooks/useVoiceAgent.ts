/**
 * useVoiceAgent — ElevenLabs Conversational AI React Hook
 *
 * 管理语音会话的完整生命周期：
 * - 麦克风权限获取
 * - WebSocket 连接建立/断开
 * - 客户端工具注册与执行
 * - 状态同步（listening / speaking / disconnected）
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";
import type { Status, Mode } from "@elevenlabs/client";
import { initTools, getCanvasTools } from "@vdc/voice-agent";
import type { CanvasStore } from "@vdc/canvas-engine";

export type AgentStatus = Status;
export type AgentMode = Mode;

export interface UseVoiceAgentOptions {
  /** ElevenLabs Agent ID */
  agentId: string;
  /** CanvasStore 实例（可延迟设置） */
  store: CanvasStore | null;
}

export interface UseVoiceAgentReturn {
  /** 是否正在监听（麦克风开启且 Agent 已连接） */
  isListening: boolean;
  /** 当前 Agent 状态 */
  status: AgentStatus;
  /** 当前模式 */
  mode: AgentMode;
  /** 最近的用户转录文本 */
  userTranscript: string;
  /** 最近的 Agent 回复文本 */
  agentResponse: string;
  /** 错误信息 */
  error: string | null;
  /** 切换监听状态 */
  toggle: () => void;
}

export function useVoiceAgent({
  agentId,
  store,
}: UseVoiceAgentOptions): UseVoiceAgentReturn {
  const [status, setStatus] = useState<AgentStatus>("disconnected");
  const [mode, setMode] = useState<AgentMode>("listening");
  const [userTranscript, setUserTranscript] = useState("");
  const [agentResponse, setAgentResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationRef = useRef<any>(null);
  const storeRef = useRef<CanvasStore | null>(store);

  // 同步 store ref
  useEffect(() => {
    storeRef.current = store;
    if (store) {
      initTools(store);
    }
  }, [store]);

  const startListening = useCallback(async () => {
    if (conversationRef.current) return;
    if (!storeRef.current) {
      setError("画布尚未初始化");
      return;
    }

    try {
      setError(null);
      setStatus("connecting");

      // 确保工具已初始化
      initTools(storeRef.current);

      const conversation = await Conversation.startSession({
        agentId,
        clientTools: getCanvasTools(),
        onConnect: ({ conversationId }) => {
          console.log("[VoiceAgent] Connected:", conversationId);
          setStatus("connected");
        },
        onDisconnect: (details) => {
          console.log("[VoiceAgent] Disconnected:", details);
          setStatus("disconnected");
          conversationRef.current = null;
        },
        onError: (message, ctx) => {
          console.error("[VoiceAgent] Error:", message, ctx);
          setError(message);
        },
        onModeChange: ({ mode: newMode }) => {
          setMode(newMode);
        },
        onStatusChange: ({ status: newStatus }) => {
          setStatus(newStatus);
        },
        onMessage: ({ message, source }) => {
          if (source === "user") {
            setUserTranscript(message);
          } else {
            setAgentResponse(message);
          }
        },
      });

      conversationRef.current = conversation;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      console.error("[VoiceAgent] Failed to start:", msg);
      setError(msg);
      setStatus("disconnected");
    }
  }, [agentId]);

  const stopListening = useCallback(async () => {
    if (!conversationRef.current) return;
    try {
      await conversationRef.current.endSession();
    } catch (err) {
      console.warn("[VoiceAgent] Error stopping:", err);
    }
    conversationRef.current = null;
    setStatus("disconnected");
  }, []);

  const toggle = useCallback(() => {
    if (status === "connected") {
      stopListening();
    } else if (status === "disconnected") {
      startListening();
    }
  }, [status, startListening, stopListening]);

  // 清理
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, []);

  return {
    isListening: status === "connected",
    status,
    mode,
    userTranscript,
    agentResponse,
    error,
    toggle,
  };
}
