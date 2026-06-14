/**
 * RoughRenderer — 手绘风格渲染器
 *
 * 使用 rough.js 将 Konva 形状渲染为手绘/素描风格。
 * 通过 Konva.Shape 的 sceneFunc 接口挂载 rough.js 绘图逻辑。
 *
 * 设计要点：
 * - rough.js 的 draw() 直接操作 canvas context，自动继承 context 的变换矩阵
 * - sceneFunc 中 context 已由 Konva 定位到 shape 的 (x,y)，只需在 (0,0) 绘制
 * - 每个 shape 持有自己的 rough.js generator options（支持不同风格）
 */

import rough from "roughjs";
import type { Options as RoughOptions } from "roughjs/bin/core";
import Konva from "konva";

// ─── 默认手绘风格 ────────────────────────────────────────────

const DEFAULT_OPTIONS: RoughOptions = {
  roughness: 1.5,
  bowing: 1,
  stroke: "#333333",
  strokeWidth: 2,
  fillStyle: "hachure",
  fillWeight: 1.5,
  hachureAngle: -41,
  hachureGap: 6,
};

/**
 * 合并用户选项与默认选项
 */
function opts(user: Partial<RoughOptions>): RoughOptions {
  return { ...DEFAULT_OPTIONS, ...user };
}

// ─── rough.js canvas 缓存 ────────────────────────────────────

/** 按 canvas 元素缓存 rough.canvas 实例 */
const roughCanvasCache = new WeakMap<HTMLCanvasElement, ReturnType<typeof rough.canvas>>();

function getRoughCanvas(canvas: HTMLCanvasElement) {
  let rc = roughCanvasCache.get(canvas);
  if (!rc) {
    rc = rough.canvas(canvas);
    roughCanvasCache.set(canvas, rc);
  }
  return rc;
}

// ─── 场景函数工厂 ─────────────────────────────────────────────

/**
 * 通用 sceneFunc：在 Konva 的 sceneFunc 中用 rough.js 绘制
 *
 * Konva 在调用 sceneFunc 前已将 context 的变换矩阵定位到 shape 的 (x,y)。
 * rough.js 的 draw() 直接操作 canvas，会继承当前变换矩阵。
 */
function roughSceneFunc(
  drawFn: (gen: ReturnType<typeof rough.generator>) => ReturnType<typeof rough.generator>,
  userOpts?: Partial<RoughOptions>
) {
  return function (this: Konva.Shape, ctx: Konva.Context, _shape: Konva.Shape) {
    const canvas = ctx.canvas._canvas as HTMLCanvasElement;
    const rc = getRoughCanvas(canvas);
    const gen = rough.generator();
    const node = drawFn(gen);
    rc.draw(node);
  };
}

// ─── 创建手绘形状 ─────────────────────────────────────────────

/** 手绘矩形 */
export function createRoughRect(config: {
  x: number; y: number; width: number; height: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  rotation?: number; opacity?: number; visible?: boolean;
  scaleX?: number; scaleY?: number;
}): Konva.Shape {
  return new Konva.Shape({
    x: config.x, y: config.y,
    rotation: config.rotation ?? 0,
    opacity: config.opacity ?? 1,
    visible: config.visible ?? true,
    scaleX: config.scaleX ?? 1,
    scaleY: config.scaleY ?? 1,
    sceneFunc: roughSceneFunc((gen) =>
      gen.rectangle(0, 0, config.width, config.height, opts({
        fill: config.fill || "transparent",
        stroke: config.stroke || "#333",
        strokeWidth: config.strokeWidth ?? 2,
      }))
    ),
  });
}

/** 手绘圆形 */
export function createRoughCircle(config: {
  x: number; y: number; radius: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  rotation?: number; opacity?: number; visible?: boolean;
  scaleX?: number; scaleY?: number;
}): Konva.Shape {
  return new Konva.Shape({
    x: config.x, y: config.y,
    rotation: config.rotation ?? 0,
    opacity: config.opacity ?? 1,
    visible: config.visible ?? true,
    scaleX: config.scaleX ?? 1,
    scaleY: config.scaleY ?? 1,
    sceneFunc: roughSceneFunc((gen) =>
      gen.circle(0, 0, config.radius * 2, opts({
        fill: config.fill || "transparent",
        stroke: config.stroke || "#333",
        strokeWidth: config.strokeWidth ?? 2,
      }))
    ),
  });
}

/** 手绘椭圆 */
export function createRoughEllipse(config: {
  x: number; y: number; width: number; height: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  rotation?: number; opacity?: number; visible?: boolean;
  scaleX?: number; scaleY?: number;
}): Konva.Shape {
  return new Konva.Shape({
    x: config.x, y: config.y,
    rotation: config.rotation ?? 0,
    opacity: config.opacity ?? 1,
    visible: config.visible ?? true,
    scaleX: config.scaleX ?? 1,
    scaleY: config.scaleY ?? 1,
    sceneFunc: roughSceneFunc((gen) =>
      gen.ellipse(0, 0, config.width, config.height, opts({
        fill: config.fill || "transparent",
        stroke: config.stroke || "#333",
        strokeWidth: config.strokeWidth ?? 2,
      }))
    ),
  });
}

/** 手绘三角形 */
export function createRoughTriangle(config: {
  x: number; y: number; radius: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  rotation?: number; opacity?: number; visible?: boolean;
  scaleX?: number; scaleY?: number;
}): Konva.Shape {
  const r = config.radius;
  const vertices: [number, number][] = [
    [0, -r],
    [r * Math.sin(2 * Math.PI / 3), -r * Math.cos(2 * Math.PI / 3)],
    [r * Math.sin(4 * Math.PI / 3), -r * Math.cos(4 * Math.PI / 3)],
  ];

  return new Konva.Shape({
    x: config.x, y: config.y,
    rotation: config.rotation ?? 0,
    opacity: config.opacity ?? 1,
    visible: config.visible ?? true,
    scaleX: config.scaleX ?? 1,
    scaleY: config.scaleY ?? 1,
    sceneFunc: roughSceneFunc((gen) =>
      gen.polygon(vertices, opts({
        fill: config.fill || "transparent",
        stroke: config.stroke || "#333",
        strokeWidth: config.strokeWidth ?? 2,
      }))
    ),
  });
}

/** 手绘线条 */
export function createRoughLine(config: {
  x: number; y: number; x2: number; y2: number;
  stroke?: string; strokeWidth?: number;
  opacity?: number; visible?: boolean;
}): Konva.Shape {
  return new Konva.Shape({
    x: config.x, y: config.y,
    opacity: config.opacity ?? 1,
    visible: config.visible ?? true,
    sceneFunc: roughSceneFunc((gen) =>
      gen.line(0, 0, config.x2 - config.x, config.y2 - config.y, opts({
        stroke: config.stroke || "#333",
        strokeWidth: config.strokeWidth ?? 2,
      }))
    ),
  });
}
