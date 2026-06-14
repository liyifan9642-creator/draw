/**
 * Grid Coordinate System — 50x50 离散网格
 *
 * 将画布抽象为 50x50 的逻辑网格，替代大模型的绝对像素计算。
 * LLM 只需输出 gridCoordinate（如 "x10y25"），前端按比例换算为真实像素。
 *
 * 设计目的：突破大语言模型的"二维空间推理盲区"。
 */

// ─── 网格常量 ────────────────────────────────────────────────

/** 网格列数（x 轴） */
export const GRID_COLS = 50;

/** 网格行数（y 轴） */
export const GRID_ROWS = 50;

/** gridCoordinate 格式正则：x{1-2位数字}y{1-2位数字} */
export const GRID_COORDINATE_REGEX = /^x(\d{1,2})y(\d{1,2})$/;

// ─── 类型 ────────────────────────────────────────────────────

/** 网格坐标（逻辑坐标） */
export interface GridCoordinate {
  /** 列号 1-50 */
  gx: number;
  /** 行号 1-50 */
  gy: number;
}

/** 像素坐标（物理坐标） */
export interface PixelCoordinate {
  x: number;
  y: number;
}

// ─── 解析 ────────────────────────────────────────────────────

/**
 * 解析 gridCoordinate 字符串为 GridCoordinate 对象
 *
 * @param coord 格式如 "x10y25", "x1y1", "x50y50"
 * @returns GridCoordinate 或 null（格式非法时）
 */
export function parseGridCoordinate(coord: string): GridCoordinate | null {
  const match = coord.match(GRID_COORDINATE_REGEX);
  if (!match) return null;

  const gx = parseInt(match[1], 10);
  const gy = parseInt(match[2], 10);

  // 范围校验 1-50
  if (gx < 1 || gx > GRID_COLS || gy < 1 || gy > GRID_ROWS) return null;

  return { gx, gy };
}

/**
 * 验证 gridCoordinate 字符串是否合法
 */
export function isValidGridCoordinate(coord: string): boolean {
  return parseGridCoordinate(coord) !== null;
}

// ─── 坐标转换 ────────────────────────────────────────────────

/**
 * 网格坐标 → 像素坐标（网格单元左上角）
 *
 * @param coord   网格坐标
 * @param canvasWidth  画布实际宽度（px）
 * @param canvasHeight 画布实际高度（px）
 * @returns 像素坐标（网格单元左上角）
 */
export function gridToPixel(
  coord: GridCoordinate,
  canvasWidth: number,
  canvasHeight: number
): PixelCoordinate {
  const cellW = canvasWidth / GRID_COLS;
  const cellH = canvasHeight / GRID_ROWS;

  return {
    x: Math.round((coord.gx - 1) * cellW),
    y: Math.round((coord.gy - 1) * cellH),
  };
}

/**
 * 网格坐标 → 像素坐标（网格单元中心）
 *
 * 用于放置图形时以网格中心对齐，视觉效果更自然。
 *
 * @param coord   网格坐标
 * @param canvasWidth  画布实际宽度（px）
 * @param canvasHeight 画布实际高度（px）
 * @returns 像素坐标（网格单元中心）
 */
export function gridToPixelCenter(
  coord: GridCoordinate,
  canvasWidth: number,
  canvasHeight: number
): PixelCoordinate {
  const cellW = canvasWidth / GRID_COLS;
  const cellH = canvasHeight / GRID_ROWS;

  return {
    x: Math.round((coord.gx - 1) * cellW + cellW / 2),
    y: Math.round((coord.gy - 1) * cellH + cellH / 2),
  };
}

/**
 * 像素坐标 → 最近的网格坐标
 *
 * @param px      像素 x
 * @param py      像素 y
 * @param canvasWidth  画布实际宽度（px）
 * @param canvasHeight 画布实际高度（px）
 * @returns 最近的网格坐标
 */
export function pixelToGrid(
  px: number,
  py: number,
  canvasWidth: number,
  canvasHeight: number
): GridCoordinate {
  const cellW = canvasWidth / GRID_COLS;
  const cellH = canvasHeight / GRID_ROWS;

  const gx = Math.max(1, Math.min(GRID_COLS, Math.round(px / cellW) + 1));
  const gy = Math.max(1, Math.min(GRID_ROWS, Math.round(py / cellH) + 1));

  return { gx, gy };
}

/**
 * 将 gridCoordinate 字符串直接解析为像素坐标（便捷函数）
 *
 * @param coord   gridCoordinate 字符串（如 "x10y25"）
 * @param canvasWidth  画布宽度
 * @param canvasHeight 画布高度
 * @param center  是否返回中心坐标（默认 true）
 * @returns 像素坐标，或 null（格式非法）
 */
export function resolveGridCoordinate(
  coord: string,
  canvasWidth: number,
  canvasHeight: number,
  center = true
): PixelCoordinate | null {
  const parsed = parseGridCoordinate(coord);
  if (!parsed) return null;

  return center
    ? gridToPixelCenter(parsed, canvasWidth, canvasHeight)
    : gridToPixel(parsed, canvasWidth, canvasHeight);
}
