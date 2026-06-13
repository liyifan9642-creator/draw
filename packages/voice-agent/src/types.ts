/**
 * Voice Agent 类型定义
 *
 * 定义工具调用结果、Agent 状态等类型。
 */

import type { ToolCallResult } from "@vdc/shared";

/** Agent 连接状态 */
export type AgentStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

/** Agent 当前模式 */
export type AgentMode = "listening" | "speaking";

/** 工具执行结果（JSON 字符串化后返回给 LLM） */
export type ToolHandler = (parameters: Record<string, unknown>) => Promise<string> | string;

/** Agent 配置选项 */
export interface AgentConfig {
  agentId: string;
}
