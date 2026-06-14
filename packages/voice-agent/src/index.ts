/**
 * @vdc/voice-agent — 语音 Agent 核心
 *
 * 负责：
 * - 工具注册与调用分发（Client Tools → CanvasStore 方法映射）
 * - ElevenLabs Conversational AI SDK 集成
 * - 语音流的开启/关闭控制
 * - V2.0: 网格坐标系统 + 几何约束对齐
 */

export { initTools, getCanvasTools, setCanvasSize, getCanvasSize, resolvePosition } from "./tools";
export type { AgentStatus, AgentMode, AgentConfig, ToolHandler } from "./types";
export type { SpatialPosition } from "./tools";
export { generateImage } from "./imageService";
export type { ImageStyle, ImageGenerationRequest, ImageGenerationResult } from "./imageService";
export type { AlignmentRelation } from "@vdc/canvas-engine";

// 模板系统
export { generateTemplate, getTemplateNames, getTemplateDescriptions, resolveTemplateName } from "./templates";
export type { TemplateName, TemplateParams, TemplateResult } from "./templates";
export { generateComplexTemplate, getComplexTemplateNames, resolveComplexTemplateName } from "./complexTemplates";
export type { ComplexTemplateName } from "./complexTemplates";

// 单独导出各工具函数，便于单元测试
export {
  set_canvas_background,
  generate_shape,
  generate_image,
  generate_template,
  generate_svg,
  search_icon,
  modify_node,
  delete_node,
  undo_action,
  redo_action,
  clear_canvas,
  add_text,
  reorder_node,
  move_node,
  align_objects,
  query_canvas_state,
} from "./tools";

// 图标搜索
export { searchIcons, getIconByName, getAllIconNames, getIconsByCategory, getCategories } from "./iconSearch";
export type { IconEntry, SearchResult } from "./iconSearch";
