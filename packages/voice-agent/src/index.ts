/**
 * @vdc/voice-agent — 语音 Agent 核心
 *
 * 负责：
 * - 工具注册与调用分发（Client Tools → CanvasStore 方法映射）
 * - ElevenLabs Conversational AI SDK 集成
 * - 语音流的开启/关闭控制
 */

export { initTools, getCanvasTools } from "./tools";
export type { AgentStatus, AgentMode, AgentConfig, ToolHandler } from "./types";

// 单独导出各工具函数，便于单元测试
export {
  set_canvas_background,
  generate_shape,
  modify_node,
  delete_node,
  undo_action,
  redo_action,
  clear_canvas,
  add_text,
  reorder_node,
  move_node,
  query_canvas_state,
} from "./tools";
