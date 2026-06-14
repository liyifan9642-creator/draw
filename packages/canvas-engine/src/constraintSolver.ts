/**
 * ConstraintSolver — 基于 kiwi.js 的几何约束求解器
 *
 * 处理复杂的相对空间对齐指令，如：
 * - "让蓝色圆形紧贴红色正方形的右侧"
 * - "让文本对齐到矩形的中心"
 *
 * 每次求解都是无状态的：根据当前节点位置建立约束 → 求解 → 返回新坐标。
 * 不持有持久化的 Solver 实例，避免状态泄漏。
 */

import { Solver, Variable, Operator, Strength } from "kiwi.js";

// ─── 类型 ────────────────────────────────────────────────────

/** 对齐关系枚举 */
export type AlignmentRelation =
  | "leftOf"      // target 的右边缘紧贴 reference 的左边缘
  | "rightOf"     // target 的左边缘紧贴 reference 的右边缘
  | "alignTop"    // target 与 reference 顶部对齐
  | "alignCenter"; // target 与 reference 中心对齐

/** 节点边界框 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 约束求解结果 */
export interface ConstraintResult {
  x: number;
  y: number;
}

// ─── 求解器 ──────────────────────────────────────────────────

/**
 * 使用 kiwi.js 求解对齐约束
 *
 * @param targetBox   目标节点的边界框（width/height 用于计算）
 * @param referenceBox 参考节点的边界框
 * @param relation    对齐关系
 * @param offset      偏移量（px），正值向外，负值向内
 * @returns 目标节点的新左上角坐标
 */
export function solveAlignment(
  targetBox: BoundingBox,
  referenceBox: BoundingBox,
  relation: AlignmentRelation,
  offset: number = 0
): ConstraintResult {
  const solver = new Solver();

  // 目标节点的 x, y 变量
  const tx = new Variable("target_x");
  const ty = new Variable("target_y");

  // 添加为可编辑变量（solver 可以自由调整它们来满足约束）
  solver.addEditVariable(tx, Strength.required);
  solver.addEditVariable(ty, Strength.required);

  // 根据对齐关系建立等式约束
  switch (relation) {
    case "rightOf": {
      // target 的左边缘 == reference 的右边缘 + offset
      // tx == referenceBox.x + referenceBox.width + offset
      solver.createConstraint(
        tx,
        Operator.Eq,
        referenceBox.x + referenceBox.width + offset
      );
      // y 方向无约束，保持当前 y
      solver.suggestValue(ty, targetBox.y);
      break;
    }

    case "leftOf": {
      // target 的右边缘 == reference 的左边缘 - offset
      // tx + targetBox.width == referenceBox.x - offset
      // tx == referenceBox.x - targetBox.width - offset
      solver.createConstraint(
        tx,
        Operator.Eq,
        referenceBox.x - targetBox.width - offset
      );
      solver.suggestValue(ty, targetBox.y);
      break;
    }

    case "alignTop": {
      // target 顶部 == reference 顶部
      // ty == referenceBox.y
      solver.createConstraint(ty, Operator.Eq, referenceBox.y + offset);
      // x 方向无约束，保持当前 x
      solver.suggestValue(tx, targetBox.x);
      break;
    }

    case "alignCenter": {
      // target 中心 == reference 中心
      // tx + targetBox.width/2 == referenceBox.x + referenceBox.width/2
      // ty + targetBox.height/2 == referenceBox.y + referenceBox.height/2
      const refCenterX = referenceBox.x + referenceBox.width / 2;
      const refCenterY = referenceBox.y + referenceBox.height / 2;

      solver.createConstraint(
        tx,
        Operator.Eq,
        refCenterX - targetBox.width / 2 + offset
      );
      solver.createConstraint(
        ty,
        Operator.Eq,
        refCenterY - targetBox.height / 2 + offset
      );
      break;
    }
  }

  // 求解
  solver.updateVariables();

  return {
    x: Math.round(tx.value()),
    y: Math.round(ty.value()),
  };
}

/**
 * 获取节点的边界框（与 CanvasStore.getBoundingBox 逻辑一致）
 */
export function getBoundingBox(node: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  type: string;
}): BoundingBox {
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
