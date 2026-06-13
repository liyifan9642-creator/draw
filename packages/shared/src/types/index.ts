/**
 * VDC 共享类型定义
 * 基于 PRD Appendix B: JSON Canvas 完整状态 Schema
 */

// ─── 画布状态 ───────────────────────────────────────────────

export interface CanvasState {
  meta: CanvasMeta;
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  actionLog: ActionEntry[];
  undoStack: Partial<CanvasState>[];
  redoStack: Partial<CanvasState>[];
}

export interface CanvasMeta {
  version: string;
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

// ─── 节点类型 ───────────────────────────────────────────────

export type NodeType =
  | "rect"
  | "circle"
  | "triangle"
  | "line"
  | "ellipse"
  | "text"
  | "image"
  | "path"
  | "group";

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  imageUrl?: string;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  scaleX: number;
  scaleY: number;
  children: string[];
  metadata: NodeMetadata;
}

export interface NodeMetadata {
  createdAt: number;
  updatedAt: number;
  createdBy: "voice" | "mouse" | "system";
  label?: string;
  name?: string;
}

// ─── 边（连线）类型 ─────────────────────────────────────────

export interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style: EdgeStyle;
}

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  dash: number[];
  type: "solid" | "dashed" | "dotted";
  arrowEnd: "none" | "arrow" | "circle";
}

// ─── 操作日志 ───────────────────────────────────────────────

export type ActionType =
  | "create"
  | "update"
  | "delete"
  | "move"
  | "resize"
  | "rotate"
  | "style"
  | "reorder"
  | "group"
  | "ungroup";

export interface ActionEntry {
  timestamp: number;
  type: ActionType;
  nodeId: string;
  beforeState: Partial<Node>;
  afterState: Partial<Node>;
}

// ─── 工具调用相关 ───────────────────────────────────────────

export interface ToolCallResult {
  success: boolean;
  nodeId?: string;
  name?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  message?: string;
  errorCode?: string;
  errorMessage?: string;
  suggestion?: string;
}

export type ErrorCode =
  | "NODE_NOT_FOUND"
  | "SHAPE_EXCEEDS_CANVAS"
  | "INVALID_PARAMS"
  | "CANVAS_EMPTY"
  | "CONFIRM_REQUIRED"
  | "HISTORY_EMPTY"
  | "REDO_STACK_EMPTY"
  | "NODE_LOCKED"
  | "ANCHOR_NOT_FOUND"
  | "CROSS_TYPE_CONFLICT"
  | "OPERATION_TIMEOUT";
