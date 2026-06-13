/**
 * Canvas Tools — LLM 可调用的客户端工具定义
 *
 * 每个工具函数映射到 CanvasStore 的对应方法。
 * 工具返回 JSON 字符串，供 LLM 解析执行结果并生成自然语言回复。
 *
 * 设计原则（PRD 3.1）：
 * - 纯函数语义：接收确定性参数，返回状态变更指令
 * - 幂等性：相同参数重复调用结果一致
 * - 原子性：单次调用完成一个最小语义单元
 * - 可回溯性：每次调用在 actionLog 中生成事务记录
 */

import type { CanvasStore } from "@vdc/canvas-engine";
import type { Node } from "@vdc/shared";

let _store: CanvasStore | null = null;
let _idCounter = 0;

/** 生成唯一节点 ID */
function nextId(type: string): string {
  _idCounter++;
  return `${type}-${Date.now()}-${_idCounter}`;
}

/** 初始化工具上下文（注入 Store 引用） */
export function initTools(store: CanvasStore): void {
  _store = store;
  _idCounter = 0;
}

/** 获取当前 Store 引用 */
function getStore(): CanvasStore {
  if (!_store) throw new Error("CanvasStore 未初始化，请先调用 initTools(store)");
  return _store;
}

// ─── 工具实现 ────────────────────────────────────────────────

/**
 * 设置画布背景色
 * 对应 PRD Tool 5: set_canvas_background
 */
export function set_canvas_background(params: { color: string }): string {
  const store = getStore();
  const result = store.setBackground(params.color);
  return JSON.stringify(result);
}

/**
 * 创建几何图形节点
 * 对应 PRD Tool 1: generate_shape
 */
export function generate_shape(params: {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  opacity?: number;
  name?: string;
}): string {
  const store = getStore();
  const id = nextId(params.type);

  const node: Node = {
    id,
    type: params.type as Node["type"],
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    radius: params.radius,
    rotation: params.rotation ?? 0,
    fill: params.fill ?? "#000000",
    stroke: params.stroke ?? "transparent",
    strokeWidth: params.strokeWidth ?? 0,
    opacity: params.opacity ?? 1,
    zIndex: store.nodeCount,
    locked: false,
    visible: true,
    scaleX: 1,
    scaleY: 1,
    children: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "voice",
      name: params.name,
    },
  };

  const result = store.addNode(node);
  return JSON.stringify(result);
}

/**
 * 修改已有节点属性
 * 对应 PRD Tool 2: modify_node
 */
export function modify_node(params: {
  target: string;
  updates: Record<string, unknown>;
}): string {
  const store = getStore();
  const result = store.updateNode(params.target, params.updates as Partial<Node>);
  return JSON.stringify(result);
}

/**
 * 删除节点
 * 对应 PRD Tool 3: delete_node
 */
export function delete_node(params: {
  target: string;
  cascade?: boolean;
}): string {
  const store = getStore();
  const result = store.deleteNode(params.target, params.cascade ?? false);
  return JSON.stringify(result);
}

/**
 * 撤销操作
 * 对应 PRD Tool 8: undo_action
 */
export function undo_action(params: { steps?: number }): string {
  const store = getStore();
  const steps = params.steps ?? 1;
  const result = steps === 1 ? store.undo() : store.undoSteps(steps);
  return JSON.stringify(result);
}

/**
 * 重做操作
 * 对应 PRD Tool 9: redo_action
 */
export function redo_action(params: { steps?: number }): string {
  const store = getStore();
  const steps = params.steps ?? 1;
  const result = steps === 1 ? store.redo() : store.redoSteps(steps);
  return JSON.stringify(result);
}

/**
 * 清空画布（需要确认）
 * 对应 PRD Tool 4: clear_canvas
 */
export function clear_canvas(params: { confirm?: boolean }): string {
  const store = getStore();
  const result = store.clearCanvas(params.confirm ?? false);
  return JSON.stringify(result);
}

/**
 * 添加文本节点
 * 对应 PRD Tool 6: add_text
 */
export function add_text(params: {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  name?: string;
}): string {
  const store = getStore();
  const id = nextId("text");

  const node: Node = {
    id,
    type: "text",
    x: params.x,
    y: params.y,
    rotation: 0,
    fill: params.fill ?? "#000000",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    text: params.text,
    fontSize: params.fontSize ?? 16,
    fontFamily: params.fontFamily ?? "Arial",
    zIndex: store.nodeCount,
    locked: false,
    visible: true,
    scaleX: 1,
    scaleY: 1,
    children: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "voice",
      name: params.name,
    },
  };

  const result = store.addNode(node);
  return JSON.stringify(result);
}

/**
 * 调整叠放顺序
 * 对应 PRD Tool 12: reorder_node
 */
export function reorder_node(params: {
  target: string;
  action: "bring_to_top" | "send_to_back" | "bring_forward" | "send_backward";
}): string {
  const store = getStore();
  const result = store.reorderNode(params.target, params.action);
  return JSON.stringify(result);
}

/**
 * 移动节点
 */
export function move_node(params: {
  target: string;
  x: number;
  y: number;
}): string {
  const store = getStore();
  const result = store.moveNode(params.target, params.x, params.y);
  return JSON.stringify(result);
}

/**
 * 查询当前画布状态摘要
 * 只读操作，不修改画布
 */
export function query_canvas_state(): string {
  const store = getStore();
  const nodes = store.getNodes();
  const summary = {
    nodeCount: store.nodeCount,
    edgeCount: store.edgeCount,
    background: store.getBackground(),
    undoDepth: store.undoDepth,
    redoDepth: store.redoDepth,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      name: n.metadata.name,
      x: Math.round(n.x),
      y: Math.round(n.y),
      fill: n.fill,
    })),
  };
  return JSON.stringify(summary);
}

// ─── 工具注册表 ──────────────────────────────────────────────

/**
 * 导出所有工具的映射表，供 ElevenLabs clientTools 配置使用
 */
export function getCanvasTools(): Record<string, (params: any) => string> {
  return {
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
  };
}
