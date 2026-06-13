/**
 * @vdc/canvas-engine — 画布渲染引擎
 *
 * 基于 Konva.js 的保留模式渲染引擎，负责：
 * - Stage / Layer 管理
 * - 图形节点渲染（Rect, Circle, Line, Text, Image, Group）
 * - 用户交互事件委托（click / drag / transform）
 * - 撤销/重做 History Stack
 * - 状态序列化与持久化
 */

export { CanvasStore } from "./store";
export type { StoreListener } from "./store";
export { KonvaRenderer } from "./renderer";
export type { RendererOptions } from "./renderer";
