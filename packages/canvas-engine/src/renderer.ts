/**
 * KonvaRenderer — 保留模式渲染层
 *
 * 严格单向数据流：只从 CanvasStore 读取状态，映射为 Konva 绘制指令。
 * 绝不直接修改 CanvasStore 内部状态。
 *
 * 职责：
 * - 创建 Konva Stage / Layer
 * - 监听 CanvasStore 变更，计算脏节点并增量更新
 * - 管理 Konva 节点与 Store 节点的映射关系
 */

import Konva from "konva";
import type { Node, Edge } from "@vdc/shared";
import { CANVAS_DEFAULTS } from "@vdc/shared";
import type { CanvasStore } from "./store";

// ─── 类型 ────────────────────────────────────────────────────

export interface RendererOptions {
  /** 挂载容器 */
  container: HTMLDivElement;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
}

// ─── KonvaRenderer ────────────────────────────────────────────

export class KonvaRenderer {
  private stage: Konva.Stage;
  private bgLayer: Konva.Layer;
  private edgeLayer: Konva.Layer;
  private nodeLayer: Konva.Layer;
  private bgRect: Konva.Rect;
  private store: CanvasStore;
  private unsubscribe: (() => void) | null = null;

  /** Store nodeId → Konva.Node 的映射 */
  private konvaNodeMap = new Map<string, Konva.Node>();
  /** Store edgeId → Konva.Arrow 的映射 */
  private konvaEdgeMap = new Map<string, Konva.Arrow>();

  /** 上一次同步时的快照，用于脏检测 */
  private lastNodesSnapshot: string = "";
  private lastEdgesSnapshot: string = "";
  private lastBackground: string = "";

  constructor(store: CanvasStore, options: RendererOptions) {
    this.store = store;

    const width = options.width ?? CANVAS_DEFAULTS.width;
    const height = options.height ?? CANVAS_DEFAULTS.height;

    // 创建 Konva Stage
    this.stage = new Konva.Stage({
      container: options.container,
      width,
      height,
    });

    // 三层：背景层 → 连线层 → 节点层（z-index 从低到高）
    this.bgLayer = new Konva.Layer({ listening: false });
    this.edgeLayer = new Konva.Layer({ listening: false });
    this.nodeLayer = new Konva.Layer();

    this.stage.add(this.bgLayer);
    this.stage.add(this.edgeLayer);
    this.stage.add(this.nodeLayer);

    // 背景矩形
    this.bgRect = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: store.getBackground(),
      listening: false,
    });
    this.bgLayer.add(this.bgRect);

    // 首次同步
    this.syncAll();

    // 订阅 Store 变更
    this.unsubscribe = store.subscribe(() => this.onStoreChange());
  }

  // ─── 公开方法 ──────────────────────────────────────────────

  /** 获取 Konva Stage（用于外部事件绑定等） */
  getStage(): Konva.Stage {
    return this.stage;
  }

  /** 调整画布尺寸 */
  resize(width: number, height: number): void {
    this.stage.width(width);
    this.stage.height(height);
    this.bgRect.width(width);
    this.bgRect.height(height);
    this.bgLayer.batchDraw();
  }

  /** 销毁渲染器，清理资源 */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.konvaNodeMap.clear();
    this.konvaEdgeMap.clear();
    this.stage.destroy();
  }

  // ─── Store 变更处理 ────────────────────────────────────────

  /** Store 变更回调：计算脏节点并增量更新 */
  private onStoreChange(): void {
    // 背景色变更
    const currentBg = this.store.getBackground();
    if (currentBg !== this.lastBackground) {
      this.bgRect.fill(currentBg);
      this.lastBackground = currentBg;
      this.bgLayer.batchDraw();
    }

    // 节点变更检测
    const nodesSnapshot = this.snapshotNodes();
    if (nodesSnapshot !== this.lastNodesSnapshot) {
      this.syncNodes();
      this.lastNodesSnapshot = nodesSnapshot;
    }

    // 边变更检测
    const edgesSnapshot = this.snapshotEdges();
    if (edgesSnapshot !== this.lastEdgesSnapshot) {
      this.syncEdges();
      this.lastEdgesSnapshot = edgesSnapshot;
    }
  }

  /** 首次全量同步 */
  private syncAll(): void {
    this.lastBackground = this.store.getBackground();
    this.syncNodes();
    this.syncEdges();
    this.lastNodesSnapshot = this.snapshotNodes();
    this.lastEdgesSnapshot = this.snapshotEdges();
  }

  /** 同步节点层 */
  private syncNodes(): void {
    const storeNodes = this.store.getNodes();
    const storeIds = new Set(storeNodes.map((n) => n.id));

    // 1. 删除已不存在的 Konva 节点
    for (const [id, konvaNode] of this.konvaNodeMap) {
      if (!storeIds.has(id)) {
        konvaNode.destroy();
        this.konvaNodeMap.delete(id);
      }
    }

    // 2. 更新或创建 Konva 节点
    // 按 zIndex 排序后依次处理
    const sorted = [...storeNodes].sort((a, b) => a.zIndex - b.zIndex);
    for (const node of sorted) {
      const existing = this.konvaNodeMap.get(node.id);
      if (existing) {
        this.updateKonvaNode(existing, node);
      } else {
        const konvaNode = this.createKonvaNode(node);
        if (konvaNode) {
          this.konvaNodeMap.set(node.id, konvaNode);
          this.nodeLayer.add(konvaNode);
        }
      }
    }

    this.nodeLayer.batchDraw();
  }

  /** 同步连线层 */
  private syncEdges(): void {
    const storeEdges = this.store.getEdges();
    const storeIds = new Set(storeEdges.map((e) => e.id));

    // 删除已不存在的连线
    for (const [id, konvaEdge] of this.konvaEdgeMap) {
      if (!storeIds.has(id)) {
        konvaEdge.destroy();
        this.konvaEdgeMap.delete(id);
      }
    }

    // 更新或创建连线
    for (const edge of storeEdges) {
      const fromNode = this.store.getNodeById(edge.from);
      const toNode = this.store.getNodeById(edge.to);
      if (!fromNode || !toNode) continue;

      const points = this.calcEdgePoints(fromNode, toNode);
      const existing = this.konvaEdgeMap.get(edge.id);

      if (existing) {
        existing.points(points);
        existing.stroke(edge.style.stroke);
        existing.strokeWidth(edge.style.strokeWidth);
        if (edge.style.dash.length > 0) existing.dash(edge.style.dash);
      } else {
        const arrow = new Konva.Arrow({
          points,
          stroke: edge.style.stroke,
          strokeWidth: edge.style.strokeWidth,
          fill: edge.style.stroke,
          dash: edge.style.dash.length > 0 ? edge.style.dash : undefined,
          pointerLength: edge.style.arrowEnd === "arrow" ? 10 : 0,
          pointerWidth: edge.style.arrowEnd === "arrow" ? 8 : 0,
          listening: false,
        });
        this.konvaEdgeMap.set(edge.id, arrow);
        this.edgeLayer.add(arrow);
      }
    }

    this.edgeLayer.batchDraw();
  }

  // ─── Konva 节点创建 ────────────────────────────────────────

  /** 根据 Store Node 类型创建对应的 Konva.Shape */
  private createKonvaNode(node: Node): Konva.Shape | Konva.Group | null {
    let shape: Konva.Shape | null = null;

    switch (node.type) {
      case "rect":
        shape = new Konva.Rect({
          x: node.x,
          y: node.y,
          width: node.width ?? 100,
          height: node.height ?? 100,
          fill: node.fill,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          rotation: node.rotation,
          opacity: node.opacity,
          scaleX: node.scaleX,
          scaleY: node.scaleY,
        });
        break;

      case "circle":
        shape = new Konva.Circle({
          x: node.x,
          y: node.y,
          radius: node.radius ?? 50,
          fill: node.fill,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          rotation: node.rotation,
          opacity: node.opacity,
          scaleX: node.scaleX,
          scaleY: node.scaleY,
        });
        break;

      case "ellipse":
        shape = new Konva.Ellipse({
          x: node.x,
          y: node.y,
          radiusX: (node.width ?? 100) / 2,
          radiusY: (node.height ?? 100) / 2,
          fill: node.fill,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          rotation: node.rotation,
          opacity: node.opacity,
          scaleX: node.scaleX,
          scaleY: node.scaleY,
        });
        break;

      case "triangle":
        shape = new Konva.RegularPolygon({
          x: node.x,
          y: node.y,
          sides: 3,
          radius: node.radius ?? Math.min(node.width ?? 50, node.height ?? 50),
          fill: node.fill,
          stroke: node.stroke,
          strokeWidth: node.strokeWidth,
          rotation: node.rotation,
          opacity: node.opacity,
          scaleX: node.scaleX,
          scaleY: node.scaleY,
        });
        break;

      case "line":
        shape = new Konva.Line({
          points: [node.x, node.y, node.x + (node.width ?? 100), node.y + (node.height ?? 0)],
          stroke: node.stroke || node.fill,
          strokeWidth: node.strokeWidth || 2,
          opacity: node.opacity,
        });
        break;

      case "text":
        shape = new Konva.Text({
          x: node.x,
          y: node.y,
          text: node.text ?? "",
          fontSize: node.fontSize ?? 16,
          fontFamily: node.fontFamily ?? "Arial",
          fill: node.fill,
          rotation: node.rotation,
          opacity: node.opacity,
          scaleX: node.scaleX,
          scaleY: node.scaleY,
        });
        break;

      default:
        // image / group / path 等暂不实现，返回占位 Rect
        shape = new Konva.Rect({
          x: node.x,
          y: node.y,
          width: node.width ?? 50,
          height: node.height ?? 50,
          fill: "#CCCCCC",
          stroke: "#999999",
          strokeWidth: 1,
          opacity: 0.5,
          dash: [5, 5],
        });
        break;
    }

    if (shape) {
      // 存储 store nodeId 用于反向查找
      shape.setAttr("storeId", node.id);
      shape.visible(node.visible);
    }

    return shape;
  }

  // ─── Konva 节点更新（脏矩形增量更新） ──────────────────────

  /** 只更新变更的属性，避免全量重建 */
  private updateKonvaNode(konvaNode: Konva.Node, storeNode: Node): void {
    // 通用属性
    konvaNode.x(storeNode.x);
    konvaNode.y(storeNode.y);
    konvaNode.rotation(storeNode.rotation);
    konvaNode.opacity(storeNode.opacity);
    konvaNode.scaleX(storeNode.scaleX);
    konvaNode.scaleY(storeNode.scaleY);
    konvaNode.visible(storeNode.visible);

    // 类型特定属性
    switch (storeNode.type) {
      case "rect":
        (konvaNode as Konva.Rect).width(storeNode.width ?? 100);
        (konvaNode as Konva.Rect).height(storeNode.height ?? 100);
        (konvaNode as Konva.Rect).fill(storeNode.fill);
        (konvaNode as Konva.Rect).stroke(storeNode.stroke);
        (konvaNode as Konva.Rect).strokeWidth(storeNode.strokeWidth);
        break;

      case "circle":
        (konvaNode as Konva.Circle).radius(storeNode.radius ?? 50);
        (konvaNode as Konva.Circle).fill(storeNode.fill);
        (konvaNode as Konva.Circle).stroke(storeNode.stroke);
        (konvaNode as Konva.Circle).strokeWidth(storeNode.strokeWidth);
        break;

      case "ellipse":
        (konvaNode as Konva.Ellipse).radiusX((storeNode.width ?? 100) / 2);
        (konvaNode as Konva.Ellipse).radiusY((storeNode.height ?? 100) / 2);
        (konvaNode as Konva.Ellipse).fill(storeNode.fill);
        (konvaNode as Konva.Ellipse).stroke(storeNode.stroke);
        (konvaNode as Konva.Ellipse).strokeWidth(storeNode.strokeWidth);
        break;

      case "text":
        (konvaNode as Konva.Text).text(storeNode.text ?? "");
        (konvaNode as Konva.Text).fontSize(storeNode.fontSize ?? 16);
        (konvaNode as Konva.Text).fontFamily(storeNode.fontFamily ?? "Arial");
        (konvaNode as Konva.Text).fill(storeNode.fill);
        break;

      case "line":
        (konvaNode as Konva.Line).points([
          storeNode.x,
          storeNode.y,
          storeNode.x + (storeNode.width ?? 100),
          storeNode.y + (storeNode.height ?? 0),
        ]);
        (konvaNode as Konva.Line).stroke(storeNode.stroke || storeNode.fill);
        (konvaNode as Konva.Line).strokeWidth(storeNode.strokeWidth || 2);
        break;

      default:
        // triangle, ellipse, placeholder 等
        if ("fill" in konvaNode) (konvaNode as any).fill(storeNode.fill);
        if ("stroke" in konvaNode) (konvaNode as any).stroke(storeNode.stroke);
        break;
    }
  }

  // ─── 工具方法 ──────────────────────────────────────────────

  /** 计算连线端点（节点中心） */
  private calcEdgePoints(from: Node, to: Node): number[] {
    const fromCx = from.x + (from.width ?? (from.radius ?? 0) * 2) / 2;
    const fromCy = from.y + (from.height ?? (from.radius ?? 0) * 2) / 2;
    const toCx = to.x + (to.width ?? (to.radius ?? 0) * 2) / 2;
    const toCy = to.y + (to.height ?? (to.radius ?? 0) * 2) / 2;
    return [fromCx, fromCy, toCx, toCy];
  }

  /** 生成节点快照字符串用于脏检测 */
  private snapshotNodes(): string {
    const nodes = this.store.getNodes();
    return nodes
      .map(
        (n) =>
          `${n.id}:${n.x},${n.y},${n.width},${n.height},${n.radius},${n.fill},${n.stroke},${n.rotation},${n.opacity},${n.visible},${n.zIndex},${n.text},${n.fontSize}`
      )
      .join("|");
  }

  /** 生成边快照字符串用于脏检测 */
  private snapshotEdges(): string {
    const edges = this.store.getEdges();
    return edges.map((e) => `${e.id}:${e.from},${e.to}`).join("|");
  }
}
