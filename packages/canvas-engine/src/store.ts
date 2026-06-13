/**
 * CanvasStore — JSON Canvas 状态机 + Undo/Redo 历史栈
 *
 * 纯数据逻辑，不依赖任何渲染层或 UI 框架。
 * 状态结构遵循 PRD Appendix B 的 JSON Canvas 规范。
 */

import type {
  Node,
  Edge,
  ActionEntry,
  ActionType,
  ToolCallResult,
  NodeMetadata,
} from "@vdc/shared";
import { CANVAS_DEFAULTS, HISTORY_LIMITS } from "@vdc/shared";

// ─── 快照：用于 undo/redo 栈的不可变状态副本 ────────────────

interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
  background: string;
}

// ─── 内部状态 ────────────────────────────────────────────────

interface InternalState {
  nodes: Node[];
  edges: Edge[];
  background: string;
  actionLog: ActionEntry[];
}

// ─── CanvasStore ─────────────────────────────────────────────

export type StoreListener = () => void;

export class CanvasStore {
  private state: InternalState;
  private undoStack: CanvasSnapshot[] = [];
  private redoStack: CanvasSnapshot[] = [];
  private listeners = new Set<StoreListener>();

  constructor(initialState?: Partial<InternalState>) {
    this.state = {
      nodes: initialState?.nodes ?? [],
      edges: initialState?.edges ?? [],
      background: initialState?.background ?? CANVAS_DEFAULTS.background,
      actionLog: initialState?.actionLog ?? [],
    };
  }

  /** 订阅状态变更，返回取消订阅函数 */
  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 通知所有订阅者 */
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // ─── 查询 ──────────────────────────────────────────────────

  /** 获取当前全部节点（只读副本） */
  getNodes(): readonly Node[] {
    return this.state.nodes;
  }

  /** 获取当前全部边（只读副本） */
  getEdges(): readonly Edge[] {
    return this.state.edges;
  }

  /** 获取画布背景色 */
  getBackground(): string {
    return this.state.background;
  }

  /** 获取操作日志 */
  getActionLog(): readonly ActionEntry[] {
    return this.state.actionLog;
  }

  /** 按 ID 查找节点 */
  getNodeById(id: string): Node | undefined {
    return this.state.nodes.find((n) => n.id === id);
  }

  /** 按 name 查找节点 */
  getNodeByName(name: string): Node | undefined {
    return this.state.nodes.find((n) => n.metadata.name === name);
  }

  /** 按 ID 或 name 查找节点 */
  resolveNode(target: string): Node | undefined {
    return this.getNodeById(target) ?? this.getNodeByName(target);
  }

  /** 按 ID 查找边 */
  getEdgeById(id: string): Edge | undefined {
    return this.state.edges.find((e) => e.id === id);
  }

  /** 当前节点数量 */
  get nodeCount(): number {
    return this.state.nodes.length;
  }

  /** 当前边数量 */
  get edgeCount(): number {
    return this.state.edges.length;
  }

  /** undo 栈深度 */
  get undoDepth(): number {
    return this.undoStack.length;
  }

  /** redo 栈深度 */
  get redoDepth(): number {
    return this.redoStack.length;
  }

  // ─── 节点操作 ──────────────────────────────────────────────

  /** 添加节点 */
  addNode(node: Node): ToolCallResult {
    if (this.state.nodes.length >= CANVAS_DEFAULTS.maxNodes) {
      return {
        success: false,
        errorCode: "INVALID_PARAMS",
        errorMessage: `画布节点数量已达上限 ${CANVAS_DEFAULTS.maxNodes}`,
      };
    }

    const existing = this.getNodeById(node.id);
    if (existing) {
      return {
        success: false,
        errorCode: "INVALID_PARAMS",
        errorMessage: `节点 ID '${node.id}' 已存在`,
      };
    }

    this.pushSnapshot();
    this.state.nodes.push({ ...node });
    this.recordAction("create", node.id, {}, { ...node });
    this.clearRedoStack();
    this.notify();

    return {
      success: true,
      nodeId: node.id,
      name: node.metadata.name,
      boundingBox: this.getBoundingBox(node),
      message: `已创建${node.type}节点`,
    };
  }

  /** 更新节点属性（部分更新） */
  updateNode(target: string, updates: Partial<Node>): ToolCallResult {
    const node = this.resolveNode(target);
    if (!node) {
      return {
        success: false,
        errorCode: "NODE_NOT_FOUND",
        errorMessage: `未找到节点 '${target}'`,
      };
    }

    this.pushSnapshot();
    const beforeState = { ...node };
    Object.assign(node, updates);
    node.metadata = { ...node.metadata, updatedAt: Date.now() };
    this.recordAction("update", node.id, beforeState, { ...node });
    this.clearRedoStack();
    this.notify();

    return {
      success: true,
      nodeId: node.id,
      name: node.metadata.name,
      boundingBox: this.getBoundingBox(node),
      message: `已更新节点 '${node.metadata.name ?? node.id}'`,
    };
  }

  /** 删除节点 */
  deleteNode(target: string, cascade = false): ToolCallResult {
    const node = this.resolveNode(target);
    if (!node) {
      return {
        success: false,
        errorCode: "NODE_NOT_FOUND",
        errorMessage: `未找到节点 '${target}'`,
      };
    }

    this.pushSnapshot();
    const beforeState = { ...node };

    // 删除关联的边
    this.state.edges = this.state.edges.filter(
      (e) => e.from !== node.id && e.to !== node.id
    );

    // 级联删除子节点
    if (cascade && node.children.length > 0) {
      for (const childId of node.children) {
        this.deleteNode(childId, true);
      }
    }

    // 从父节点的 children 中移除
    for (const other of this.state.nodes) {
      const idx = other.children.indexOf(node.id);
      if (idx !== -1) other.children.splice(idx, 1);
    }

    this.state.nodes = this.state.nodes.filter((n) => n.id !== node.id);
    this.recordAction("delete", node.id, beforeState, {});
    this.clearRedoStack();
    this.notify();

    return {
      success: true,
      nodeId: node.id,
      message: `已删除节点 '${node.metadata.name ?? node.id}'`,
    };
  }

  /** 批量删除指定类型的所有节点 */
  deleteNodesByType(type: Node["type"]): ToolCallResult {
    const targets = this.state.nodes.filter((n) => n.type === type);
    if (targets.length === 0) {
      return {
        success: false,
        errorCode: "CANVAS_EMPTY",
        errorMessage: `画布上没有 ${type} 类型的节点`,
      };
    }

    this.pushSnapshot();
    const ids = new Set(targets.map((n) => n.id));
    this.state.nodes = this.state.nodes.filter((n) => !ids.has(n.id));
    this.state.edges = this.state.edges.filter(
      (e) => !ids.has(e.from) && !ids.has(e.to)
    );

    for (const node of targets) {
      this.recordAction("delete", node.id, { ...node }, {});
    }
    this.clearRedoStack();
    this.notify();

    return {
      success: true,
      message: `已删除 ${targets.length} 个 ${type} 节点`,
    };
  }

  // ─── 边操作 ────────────────────────────────────────────────

  /** 添加边 */
  addEdge(edge: Edge): ToolCallResult {
    const fromNode = this.getNodeById(edge.from);
    const toNode = this.getNodeById(edge.to);

    if (!fromNode) {
      return {
        success: false,
        errorCode: "ANCHOR_NOT_FOUND",
        errorMessage: `源节点 '${edge.from}' 不存在`,
      };
    }
    if (!toNode) {
      return {
        success: false,
        errorCode: "ANCHOR_NOT_FOUND",
        errorMessage: `目标节点 '${edge.to}' 不存在`,
      };
    }

    this.pushSnapshot();
    this.state.edges.push({ ...edge });
    this.clearRedoStack();
    this.notify();

    return {
      success: true,
      message: `已创建连线 ${edge.from} → ${edge.to}`,
    };
  }

  /** 删除边 */
  deleteEdge(edgeId: string): ToolCallResult {
    const idx = this.state.edges.findIndex((e) => e.id === edgeId);
    if (idx === -1) {
      return {
        success: false,
        errorCode: "NODE_NOT_FOUND",
        errorMessage: `未找到连线 '${edgeId}'`,
      };
    }

    this.pushSnapshot();
    this.state.edges.splice(idx, 1);
    this.clearRedoStack();
    this.notify();

    return { success: true, message: "已删除连线" };
  }

  // ─── 画布操作 ──────────────────────────────────────────────

  /** 设置画布背景 */
  setBackground(color: string): ToolCallResult {
    this.pushSnapshot();
    this.state.background = color;
    this.clearRedoStack();
    this.notify();

    return { success: true, message: `已将背景色设为 ${color}` };
  }

  /**
   * 清空画布（不可撤销操作）
   * PRD US-5: clear_canvas 需要 confirm=true，且会清空 undo/redo 栈
   */
  clearCanvas(confirm = false): ToolCallResult {
    if (!confirm) {
      return {
        success: false,
        errorCode: "CONFIRM_REQUIRED",
        errorMessage: "清空画布需要确认，请传入 confirm=true",
      };
    }

    this.state.nodes = [];
    this.state.edges = [];
    this.state.background = CANVAS_DEFAULTS.background;
    this.undoStack = [];
    this.redoStack = [];
    this.state.actionLog = [];
    this.notify();

    return { success: true, message: "画布已清空，历史记录已重置" };
  }

  // ─── 空间操作 ──────────────────────────────────────────────

  /** 移动节点 */
  moveNode(target: string, x: number, y: number): ToolCallResult {
    return this.updateNode(target, { x, y });
  }

  /** 调整节点大小 */
  resizeNode(
    target: string,
    width: number,
    height: number
  ): ToolCallResult {
    return this.updateNode(target, { width, height });
  }

  /** 旋转节点 */
  rotateNode(target: string, rotation: number): ToolCallResult {
    return this.updateNode(target, { rotation });
  }

  /** 调整叠放顺序 */
  reorderNode(
    target: string,
    action: "bring_to_top" | "send_to_back" | "bring_forward" | "send_backward"
  ): ToolCallResult {
    const node = this.resolveNode(target);
    if (!node) {
      return {
        success: false,
        errorCode: "NODE_NOT_FOUND",
        errorMessage: `未找到节点 '${target}'`,
      };
    }

    this.pushSnapshot();
    const sorted = [...this.state.nodes].sort(
      (a, b) => a.zIndex - b.zIndex
    );
    const maxZ = sorted[sorted.length - 1]?.zIndex ?? 0;
    const minZ = sorted[0]?.zIndex ?? 0;

    switch (action) {
      case "bring_to_top":
        node.zIndex = maxZ + 1;
        break;
      case "send_to_back":
        node.zIndex = minZ - 1;
        break;
      case "bring_forward": {
        const above = sorted.find(
          (n) => n.id !== node.id && n.zIndex > node.zIndex
        );
        if (above) {
          const tmp = node.zIndex;
          node.zIndex = above.zIndex;
          above.zIndex = tmp;
        }
        break;
      }
      case "send_backward": {
        const below = [...sorted]
          .reverse()
          .find((n) => n.id !== node.id && n.zIndex < node.zIndex);
        if (below) {
          const tmp = node.zIndex;
          node.zIndex = below.zIndex;
          below.zIndex = tmp;
        }
        break;
      }
    }

    this.recordAction("reorder", node.id, {}, { zIndex: node.zIndex });
    this.clearRedoStack();
    this.notify();

    return {
      success: true,
      nodeId: node.id,
      message: `已调整节点 '${node.metadata.name ?? node.id}' 的叠放顺序`,
    };
  }

  // ─── Undo / Redo ──────────────────────────────────────────

  /**
   * 撤销最近一步操作
   * PRD US-5: 从 undoStack 弹出快照，恢复状态，将当前状态压入 redoStack
   */
  undo(): ToolCallResult {
    if (this.undoStack.length === 0) {
      return {
        success: false,
        errorCode: "HISTORY_EMPTY",
        errorMessage: "没有可撤销的操作",
      };
    }

    // 将当前状态保存到 redo 栈
    this.redoStack.push(this.takeSnapshot());

    // 恢复 undo 栈顶的快照
    const snapshot = this.undoStack.pop()!;
    this.restoreSnapshot(snapshot);
    this.notify();

    return {
      success: true,
      message: `已撤销，剩余可撤销 ${this.undoStack.length} 步`,
    };
  }

  /**
   * 重做最近一步被撤销的操作
   * PRD US-5: 从 redoStack 弹出快照，恢复状态，将当前状态压入 undoStack
   */
  redo(): ToolCallResult {
    if (this.redoStack.length === 0) {
      return {
        success: false,
        errorCode: "REDO_STACK_EMPTY",
        errorMessage: "没有可重做的操作",
      };
    }

    // 将当前状态保存到 undo 栈
    this.undoStack.push(this.takeSnapshot());

    // 恢复 redo 栈顶的快照
    const snapshot = this.redoStack.pop()!;
    this.restoreSnapshot(snapshot);
    this.notify();

    return {
      success: true,
      message: "已重做",
    };
  }

  /**
   * 连续撤销 N 步
   * PRD US-5: "撤销三步" → 依次弹出并逆执行 N 条操作
   */
  undoSteps(steps: number): ToolCallResult {
    const actualSteps = Math.min(steps, this.undoStack.length);
    if (actualSteps === 0) {
      return {
        success: false,
        errorCode: "HISTORY_EMPTY",
        errorMessage: "没有可撤销的操作",
      };
    }

    const results: string[] = [];
    for (let i = 0; i < actualSteps; i++) {
      const result = this.undo();
      if (result.success) results.push(result.message!);
    }

    return {
      success: true,
      message: `已撤销 ${actualSteps} 步操作`,
    };
  }

  /**
   * 连续重做 N 步
   */
  redoSteps(steps: number): ToolCallResult {
    const actualSteps = Math.min(steps, this.redoStack.length);
    if (actualSteps === 0) {
      return {
        success: false,
        errorCode: "REDO_STACK_EMPTY",
        errorMessage: "没有可重做的操作",
      };
    }

    for (let i = 0; i < actualSteps; i++) {
      this.redo();
    }

    return {
      success: true,
      message: `已重做 ${actualSteps} 步操作`,
    };
  }

  // ─── 序列化 ────────────────────────────────────────────────

  /** 导出当前状态为 JSON 可序列化对象 */
  toJSON(): {
    nodes: Node[];
    edges: Edge[];
    background: string;
    actionLog: ActionEntry[];
  } {
    return {
      nodes: this.state.nodes.map((n) => ({ ...n, metadata: { ...n.metadata } })),
      edges: this.state.edges.map((e) => ({ ...e, style: { ...e.style } })),
      background: this.state.background,
      actionLog: [...this.state.actionLog],
    };
  }

  // ─── 内部方法 ──────────────────────────────────────────────

  /** 深拷贝当前状态为快照 */
  private takeSnapshot(): CanvasSnapshot {
    return {
      nodes: this.state.nodes.map((n) => ({
        ...n,
        metadata: { ...n.metadata },
        children: [...n.children],
      })),
      edges: this.state.edges.map((e) => ({
        ...e,
        style: { ...e.style },
      })),
      background: this.state.background,
    };
  }

  /** 从快照恢复状态 */
  private restoreSnapshot(snapshot: CanvasSnapshot): void {
    this.state.nodes = snapshot.nodes.map((n) => ({
      ...n,
      metadata: { ...n.metadata },
      children: [...n.children],
    }));
    this.state.edges = snapshot.edges.map((e) => ({
      ...e,
      style: { ...e.style },
    }));
    this.state.background = snapshot.background;
  }

  /** 将当前状态快照压入 undo 栈，遵守最大深度限制 */
  private pushSnapshot(): void {
    this.undoStack.push(this.takeSnapshot());

    // FIFO：超出最大步数时丢弃最旧记录
    while (this.undoStack.length > HISTORY_LIMITS.maxSteps) {
      this.undoStack.shift();
    }
  }

  /** 清空 redo 栈（PRD: 执行新操作时重做栈立即清空） */
  private clearRedoStack(): void {
    this.redoStack = [];
  }

  /** 记录操作日志 */
  private recordAction(
    type: ActionType,
    nodeId: string,
    beforeState: Partial<Node>,
    afterState: Partial<Node>
  ): void {
    const entry: ActionEntry = {
      timestamp: Date.now(),
      type,
      nodeId,
      beforeState,
      afterState,
    };
    this.state.actionLog.push(entry);

    // 环形缓冲，超出最大长度时丢弃最旧记录
    while (this.state.actionLog.length > HISTORY_LIMITS.maxActionLogLength) {
      this.state.actionLog.shift();
    }
  }

  /** 计算节点边界框 */
  private getBoundingBox(
    node: Node
  ): { x: number; y: number; width: number; height: number } {
    if (node.type === "circle" && node.radius != null) {
      return {
        x: node.x - node.radius,
        y: node.y - node.radius,
        width: node.radius * 2,
        height: node.radius * 2,
      };
    }
    return {
      x: node.x,
      y: node.y,
      width: node.width ?? 0,
      height: node.height ?? 0,
    };
  }
}
