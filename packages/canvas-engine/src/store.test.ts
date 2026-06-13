/**
 * CanvasStore 单元测试
 *
 * 覆盖：
 * - 节点增删改查
 * - 边增删
 * - 画布背景控制
 * - Undo/Redo 历史栈
 * - 边界条件与错误处理
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CanvasStore } from "./store";
import type { Node, Edge } from "@vdc/shared";
import { CANVAS_DEFAULTS, HISTORY_LIMITS } from "@vdc/shared";

// ─── 测试辅助函数 ────────────────────────────────────────────

function makeRect(overrides: Partial<Node> = {}): Node {
  return {
    id: overrides.id ?? `rect-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "rect",
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    fill: "#FF0000",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    scaleX: 1,
    scaleY: 1,
    children: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "voice",
      name: overrides.metadata?.name,
    },
    ...overrides,
  };
}

function makeCircle(overrides: Partial<Node> = {}): Node {
  return {
    id: overrides.id ?? `circle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "circle",
    x: 300,
    y: 300,
    radius: 50,
    rotation: 0,
    fill: "#0000FF",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    scaleX: 1,
    scaleY: 1,
    children: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "voice",
      name: overrides.metadata?.name,
    },
    ...overrides,
  };
}

function makeEdge(from: string, to: string, id?: string): Edge {
  return {
    id: id ?? `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from,
    to,
    style: {
      stroke: "#333333",
      strokeWidth: 2,
      dash: [],
      type: "solid",
      arrowEnd: "arrow",
    },
  };
}

// ─── 测试套件 ────────────────────────────────────────────────

describe("CanvasStore", () => {
  let store: CanvasStore;

  beforeEach(() => {
    store = new CanvasStore();
  });

  // ─── 初始状态 ──────────────────────────────────────────────

  describe("初始状态", () => {
    it("应有空的节点列表", () => {
      expect(store.getNodes()).toEqual([]);
      expect(store.nodeCount).toBe(0);
    });

    it("应有空的边列表", () => {
      expect(store.getEdges()).toEqual([]);
      expect(store.edgeCount).toBe(0);
    });

    it("应有默认白色背景", () => {
      expect(store.getBackground()).toBe(CANVAS_DEFAULTS.background);
    });

    it("undo/redo 栈应为空", () => {
      expect(store.undoDepth).toBe(0);
      expect(store.redoDepth).toBe(0);
    });
  });

  // ─── addNode ───────────────────────────────────────────────

  describe("addNode", () => {
    it("应成功添加矩形节点", () => {
      const rect = makeRect({ id: "r1", metadata: { createdAt: 0, updatedAt: 0, createdBy: "voice", name: "矩形A" } });
      const result = store.addNode(rect);

      expect(result.success).toBe(true);
      expect(result.nodeId).toBe("r1");
      expect(store.nodeCount).toBe(1);
      expect(store.getNodeById("r1")).toBeDefined();
      expect(store.getNodeById("r1")!.fill).toBe("#FF0000");
    });

    it("应成功添加圆形节点", () => {
      const circle = makeCircle({ id: "c1" });
      const result = store.addNode(circle);

      expect(result.success).toBe(true);
      expect(store.nodeCount).toBe(1);
      expect(store.getNodeById("c1")!.type).toBe("circle");
    });

    it("不应添加重复 ID 的节点", () => {
      const rect = makeRect({ id: "r1" });
      store.addNode(rect);
      const result = store.addNode(makeRect({ id: "r1" }));

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_PARAMS");
      expect(store.nodeCount).toBe(1);
    });

    it("节点数量达到上限时应拒绝添加", () => {
      // 填满到上限
      for (let i = 0; i < CANVAS_DEFAULTS.maxNodes; i++) {
        store.addNode(makeRect({ id: `r-${i}` }));
      }
      expect(store.nodeCount).toBe(CANVAS_DEFAULTS.maxNodes);

      const result = store.addNode(makeRect({ id: "overflow" }));
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_PARAMS");
    });

    it("添加节点后 undo 栈深度应为 1", () => {
      store.addNode(makeRect({ id: "r1" }));
      expect(store.undoDepth).toBe(1);
    });
  });

  // ─── getNodeById / getNodeByName / resolveNode ─────────────

  describe("节点查询", () => {
    it("应按 ID 查找节点", () => {
      const rect = makeRect({ id: "r1" });
      store.addNode(rect);

      expect(store.getNodeById("r1")).toBeDefined();
      expect(store.getNodeById("nonexistent")).toBeUndefined();
    });

    it("应按 name 查找节点", () => {
      const rect = makeRect({ id: "r1", metadata: { createdAt: 0, updatedAt: 0, createdBy: "voice", name: "我的矩形" } });
      store.addNode(rect);

      expect(store.getNodeByName("我的矩形")).toBeDefined();
      expect(store.getNodeByName("不存在")).toBeUndefined();
    });

    it("resolveNode 应优先按 ID 查找，回退到 name", () => {
      const rect = makeRect({ id: "r1", metadata: { createdAt: 0, updatedAt: 0, createdBy: "voice", name: "矩形A" } });
      store.addNode(rect);

      expect(store.resolveNode("r1")).toBeDefined();
      expect(store.resolveNode("矩形A")).toBeDefined();
      expect(store.resolveNode("不存在")).toBeUndefined();
    });
  });

  // ─── updateNode ────────────────────────────────────────────

  describe("updateNode", () => {
    it("应成功更新节点颜色", () => {
      store.addNode(makeRect({ id: "r1", fill: "#FF0000" }));
      const result = store.updateNode("r1", { fill: "#00FF00" });

      expect(result.success).toBe(true);
      expect(store.getNodeById("r1")!.fill).toBe("#00FF00");
    });

    it("应成功更新节点位置", () => {
      store.addNode(makeRect({ id: "r1", x: 100, y: 100 }));
      const result = store.updateNode("r1", { x: 200, y: 300 });

      expect(result.success).toBe(true);
      expect(store.getNodeById("r1")!.x).toBe(200);
      expect(store.getNodeById("r1")!.y).toBe(300);
    });

    it("应通过 name 查找并更新节点", () => {
      store.addNode(makeRect({ id: "r1", metadata: { createdAt: 0, updatedAt: 0, createdBy: "voice", name: "矩形A" } }));
      const result = store.updateNode("矩形A", { fill: "#0000FF" });

      expect(result.success).toBe(true);
      expect(store.getNodeById("r1")!.fill).toBe("#0000FF");
    });

    it("不存在的节点应返回错误", () => {
      const result = store.updateNode("nonexistent", { fill: "#000" });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NODE_NOT_FOUND");
    });

    it("更新节点后 undo 栈深度应增加", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.updateNode("r1", { fill: "#00FF00" });

      expect(store.undoDepth).toBe(2); // addNode + updateNode
    });
  });

  // ─── deleteNode ────────────────────────────────────────────

  describe("deleteNode", () => {
    it("应成功删除节点", () => {
      store.addNode(makeRect({ id: "r1" }));
      const result = store.deleteNode("r1");

      expect(result.success).toBe(true);
      expect(store.nodeCount).toBe(0);
      expect(store.getNodeById("r1")).toBeUndefined();
    });

    it("应同时删除关联的边", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));
      store.addEdge(makeEdge("r1", "r2", "e1"));

      expect(store.edgeCount).toBe(1);
      store.deleteNode("r1");
      expect(store.edgeCount).toBe(0);
    });

    it("不存在的节点应返回错误", () => {
      const result = store.deleteNode("nonexistent");
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NODE_NOT_FOUND");
    });

    it("删除节点后应能撤销恢复", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.deleteNode("r1");
      expect(store.nodeCount).toBe(0);

      store.undo();
      expect(store.nodeCount).toBe(1);
      expect(store.getNodeById("r1")).toBeDefined();
    });
  });

  // ─── deleteNodesByType ─────────────────────────────────────

  describe("deleteNodesByType", () => {
    it("应删除指定类型的所有节点", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));
      store.addNode(makeCircle({ id: "c1" }));

      const result = store.deleteNodesByType("rect");
      expect(result.success).toBe(true);
      expect(store.nodeCount).toBe(1);
      expect(store.getNodeById("c1")).toBeDefined();
    });

    it("没有匹配类型时应返回错误", () => {
      store.addNode(makeRect({ id: "r1" }));
      const result = store.deleteNodesByType("circle");
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("CANVAS_EMPTY");
    });
  });

  // ─── addEdge / deleteEdge ──────────────────────────────────

  describe("边操作", () => {
    it("应成功添加边", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));
      const result = store.addEdge(makeEdge("r1", "r2", "e1"));

      expect(result.success).toBe(true);
      expect(store.edgeCount).toBe(1);
    });

    it("源节点不存在时应返回错误", () => {
      store.addNode(makeRect({ id: "r2" }));
      const result = store.addEdge(makeEdge("nonexistent", "r2"));

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("ANCHOR_NOT_FOUND");
    });

    it("目标节点不存在时应返回错误", () => {
      store.addNode(makeRect({ id: "r1" }));
      const result = store.addEdge(makeEdge("r1", "nonexistent"));

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("ANCHOR_NOT_FOUND");
    });

    it("应成功删除边", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));
      store.addEdge(makeEdge("r1", "r2", "e1"));

      const result = store.deleteEdge("e1");
      expect(result.success).toBe(true);
      expect(store.edgeCount).toBe(0);
    });

    it("不存在的边应返回错误", () => {
      const result = store.deleteEdge("nonexistent");
      expect(result.success).toBe(false);
    });
  });

  // ─── setBackground ─────────────────────────────────────────

  describe("setBackground", () => {
    it("应成功设置背景色", () => {
      const result = store.setBackground("#F0F0F0");
      expect(result.success).toBe(true);
      expect(store.getBackground()).toBe("#F0F0F0");
    });

    it("应能撤销背景色更改", () => {
      store.setBackground("#F0F0F0");
      store.undo();
      expect(store.getBackground()).toBe(CANVAS_DEFAULTS.background);
    });
  });

  // ─── clearCanvas ───────────────────────────────────────────

  describe("clearCanvas", () => {
    it("未确认时应拒绝执行", () => {
      store.addNode(makeRect({ id: "r1" }));
      const result = store.clearCanvas(false);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("CONFIRM_REQUIRED");
      expect(store.nodeCount).toBe(1);
    });

    it("确认后应清空所有节点、边和历史", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeCircle({ id: "c1" }));
      store.updateNode("r1", { fill: "#00FF00" });

      expect(store.undoDepth).toBeGreaterThan(0);

      const result = store.clearCanvas(true);
      expect(result.success).toBe(true);
      expect(store.nodeCount).toBe(0);
      expect(store.edgeCount).toBe(0);
      expect(store.undoDepth).toBe(0);
      expect(store.redoDepth).toBe(0);
      expect(store.getActionLog()).toEqual([]);
    });
  });

  // ─── 空间操作快捷方法 ──────────────────────────────────────

  describe("空间操作", () => {
    it("moveNode 应更新节点坐标", () => {
      store.addNode(makeRect({ id: "r1", x: 100, y: 100 }));
      const result = store.moveNode("r1", 500, 600);

      expect(result.success).toBe(true);
      expect(store.getNodeById("r1")!.x).toBe(500);
      expect(store.getNodeById("r1")!.y).toBe(600);
    });

    it("resizeNode 应更新节点尺寸", () => {
      store.addNode(makeRect({ id: "r1", width: 200, height: 150 }));
      const result = store.resizeNode("r1", 400, 300);

      expect(result.success).toBe(true);
      expect(store.getNodeById("r1")!.width).toBe(400);
      expect(store.getNodeById("r1")!.height).toBe(300);
    });

    it("rotateNode 应更新旋转角度", () => {
      store.addNode(makeRect({ id: "r1", rotation: 0 }));
      const result = store.rotateNode("r1", 45);

      expect(result.success).toBe(true);
      expect(store.getNodeById("r1")!.rotation).toBe(45);
    });
  });

  // ─── reorderNode ───────────────────────────────────────────

  describe("reorderNode", () => {
    it("bring_to_top 应将节点 zIndex 设为最大值 + 1", () => {
      store.addNode(makeRect({ id: "r1", zIndex: 1 }));
      store.addNode(makeRect({ id: "r2", zIndex: 5 }));

      store.reorderNode("r1", "bring_to_top");
      expect(store.getNodeById("r1")!.zIndex).toBe(6);
    });

    it("send_to_back 应将节点 zIndex 设为最小值 - 1", () => {
      store.addNode(makeRect({ id: "r1", zIndex: 5 }));
      store.addNode(makeRect({ id: "r2", zIndex: 1 }));

      store.reorderNode("r1", "send_to_back");
      expect(store.getNodeById("r1")!.zIndex).toBe(0);
    });

    it("不存在的节点应返回错误", () => {
      const result = store.reorderNode("nonexistent", "bring_to_top");
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NODE_NOT_FOUND");
    });
  });

  // ─── Undo / Redo 核心 ─────────────────────────────────────

  describe("Undo / Redo", () => {
    it("undo 空栈应返回 HISTORY_EMPTY", () => {
      const result = store.undo();
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("HISTORY_EMPTY");
    });

    it("redo 空栈应返回 REDO_STACK_EMPTY", () => {
      const result = store.redo();
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("REDO_STACK_EMPTY");
    });

    it("添加节点后撤销，节点应消失", () => {
      store.addNode(makeRect({ id: "r1", fill: "#FF0000" }));
      expect(store.nodeCount).toBe(1);

      const result = store.undo();
      expect(result.success).toBe(true);
      expect(store.nodeCount).toBe(0);
      expect(store.getNodeById("r1")).toBeUndefined();
    });

    it("撤销后重做，节点应恢复", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.undo();
      expect(store.nodeCount).toBe(0);

      store.redo();
      expect(store.nodeCount).toBe(1);
      expect(store.getNodeById("r1")).toBeDefined();
    });

    it("连续修改两次颜色，撤销一次应恢复到第一次修改后", () => {
      store.addNode(makeRect({ id: "r1", fill: "#FF0000" }));
      store.updateNode("r1", { fill: "#00FF00" }); // 第一次修改
      store.updateNode("r1", { fill: "#0000FF" }); // 第二次修改
      expect(store.getNodeById("r1")!.fill).toBe("#0000FF");

      store.undo(); // 撤销第二次修改
      expect(store.getNodeById("r1")!.fill).toBe("#00FF00");
    });

    it("连续修改两次颜色，撤销再重做，状态应正确切换", () => {
      store.addNode(makeRect({ id: "r1", fill: "#FF0000" }));
      store.updateNode("r1", { fill: "#00FF00" }); // → 绿
      store.updateNode("r1", { fill: "#0000FF" }); // → 蓝

      store.undo(); // 蓝 → 绿
      expect(store.getNodeById("r1")!.fill).toBe("#00FF00");

      store.redo(); // 绿 → 蓝
      expect(store.getNodeById("r1")!.fill).toBe("#0000FF");
    });

    it("执行新操作后 redo 栈应被清空", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.updateNode("r1", { fill: "#00FF00" });
      store.undo(); // redo 栈有 1 项
      expect(store.redoDepth).toBe(1);

      store.addNode(makeCircle({ id: "c1" })); // 新操作 → 清空 redo
      expect(store.redoDepth).toBe(0);
    });

    it("undoSteps(3) 应连续撤销 3 步", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));
      store.addNode(makeRect({ id: "r3" }));
      expect(store.nodeCount).toBe(3);

      store.undoSteps(3);
      expect(store.nodeCount).toBe(0);
    });

    it("redoSteps(2) 应连续重做 2 步", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));
      store.undoSteps(2);
      expect(store.nodeCount).toBe(0);

      store.redoSteps(2);
      expect(store.nodeCount).toBe(2);
    });

    it("撤销步数超过栈深度时应撤销全部", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));

      const result = store.undoSteps(100); // 只有 2 步可撤销
      expect(result.success).toBe(true);
      expect(store.nodeCount).toBe(0);
    });

    it("删除节点后撤销，节点和关联的边应恢复", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.addNode(makeRect({ id: "r2" }));
      store.addEdge(makeEdge("r1", "r2", "e1"));

      store.deleteNode("r1");
      expect(store.nodeCount).toBe(1);
      expect(store.edgeCount).toBe(0);

      store.undo();
      expect(store.nodeCount).toBe(2);
      expect(store.edgeCount).toBe(1);
    });

    it("背景色修改的撤销/重做", () => {
      store.setBackground("#FF0000");
      store.setBackground("#00FF00");

      expect(store.getBackground()).toBe("#00FF00");

      store.undo();
      expect(store.getBackground()).toBe("#FF0000");

      store.undo();
      expect(store.getBackground()).toBe(CANVAS_DEFAULTS.background);

      store.redo();
      expect(store.getBackground()).toBe("#FF0000");

      store.redo();
      expect(store.getBackground()).toBe("#00FF00");
    });
  });

  // ─── History Stack 深度限制 ────────────────────────────────

  describe("History Stack 深度限制", () => {
    it("undo 栈不应超过 maxSteps", () => {
      for (let i = 0; i < HISTORY_LIMITS.maxSteps + 10; i++) {
        store.addNode(makeRect({ id: `r-${i}` }));
      }

      expect(store.undoDepth).toBeLessThanOrEqual(HISTORY_LIMITS.maxSteps);
    });
  });

  // ─── actionLog ─────────────────────────────────────────────

  describe("actionLog", () => {
    it("添加节点应记录 create 操作", () => {
      store.addNode(makeRect({ id: "r1" }));
      const log = store.getActionLog();

      expect(log.length).toBe(1);
      expect(log[0].type).toBe("create");
      expect(log[0].nodeId).toBe("r1");
    });

    it("更新节点应记录 update 操作", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.updateNode("r1", { fill: "#00FF00" });

      const log = store.getActionLog();
      expect(log.length).toBe(2);
      expect(log[1].type).toBe("update");
    });

    it("删除节点应记录 delete 操作", () => {
      store.addNode(makeRect({ id: "r1" }));
      store.deleteNode("r1");

      const log = store.getActionLog();
      expect(log.length).toBe(2);
      expect(log[1].type).toBe("delete");
    });
  });

  // ─── toJSON ────────────────────────────────────────────────

  describe("toJSON", () => {
    it("应导出当前状态的深拷贝", () => {
      store.addNode(makeRect({ id: "r1", fill: "#FF0000" }));
      store.setBackground("#F0F0F0");

      const json = store.toJSON();
      expect(json.nodes.length).toBe(1);
      expect(json.nodes[0].fill).toBe("#FF0000");
      expect(json.background).toBe("#F0F0F0");

      // 修改导出的数据不应影响 store 内部状态
      json.nodes[0].fill = "#000000";
      expect(store.getNodeById("r1")!.fill).toBe("#FF0000");
    });
  });
});
