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
import { CANVAS_DEFAULTS, resolveGridCoordinate } from "@vdc/shared";
import { generateImage } from "./imageService";
import type { ImageStyle } from "./imageService";
import type { AlignmentRelation } from "@vdc/canvas-engine";
import { generateTemplate } from "./templates";
import { searchIcons } from "./iconSearch";

let _store: CanvasStore | null = null;
let _idCounter = 0;

/** 画布尺寸上下文（由渲染层设置，供 position 解析使用） */
let _canvasWidth: number = CANVAS_DEFAULTS.width;
let _canvasHeight: number = CANVAS_DEFAULTS.height;

/** 安全边距（px），图形不会紧贴画布边缘 */
const POSITION_MARGIN = 50;

/** 空间方位枚举 */
export type SpatialPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

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

/** 设置画布尺寸（由渲染层在初始化和 resize 时调用） */
export function setCanvasSize(width: number, height: number): void {
  _canvasWidth = width;
  _canvasHeight = height;
}

/** 获取当前画布尺寸 */
export function getCanvasSize(): { width: number; height: number } {
  return { width: _canvasWidth, height: _canvasHeight };
}

/**
 * 将空间方位枚举解析为像素坐标
 *
 * @param position  方位枚举
 * @param nodeWidth  图形宽度（circle 为 radius*2）
 * @param nodeHeight 图形高度
 * @returns { x, y } 左上角坐标
 */
export function resolvePosition(
  position: SpatialPosition,
  nodeWidth: number,
  nodeHeight: number
): { x: number; y: number } {
  const m = POSITION_MARGIN;
  const cw = _canvasWidth;
  const ch = _canvasHeight;

  switch (position) {
    case "top-left":
      return { x: m, y: m };
    case "top-right":
      return { x: cw - nodeWidth - m, y: m };
    case "bottom-left":
      return { x: m, y: ch - nodeHeight - m };
    case "bottom-right":
      return { x: cw - nodeWidth - m, y: ch - nodeHeight - m };
    case "center":
    default:
      return {
        x: Math.round((cw - nodeWidth) / 2),
        y: Math.round((ch - nodeHeight) / 2),
      };
  }
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
 *
 * 支持三种定位模式（优先级从高到低）：
 * 1. gridCoordinate：网格坐标（如 "x10y25"），前端按比例换算为像素
 * 2. 空间方位：传入 position 枚举，前端根据画布尺寸动态计算 x, y
 * 3. 绝对坐标：直接传入 x, y（像素）
 *
 * V2.0 新增 gridCoordinate，突破 LLM 的"二维空间推理盲区"。
 */
export function generate_shape(params: {
  type: string;
  x?: number;
  y?: number;
  position?: SpatialPosition;
  gridCoordinate?: string;
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

  // 计算图形尺寸（用于 position 解析）
  const nodeWidth = params.width ?? (params.radius ? params.radius * 2 : 100);
  const nodeHeight = params.height ?? (params.radius ? params.radius * 2 : 100);

  // 优先级：gridCoordinate > position > x/y 绝对坐标
  let x: number;
  let y: number;

  if (params.gridCoordinate) {
    // V2.0: 网格坐标 → 像素坐标（网格中心对齐）
    const resolved = resolveGridCoordinate(
      params.gridCoordinate,
      _canvasWidth,
      _canvasHeight,
      true
    );
    if (!resolved) {
      return JSON.stringify({
        success: false,
        errorCode: "INVALID_PARAMS",
        errorMessage: `无效的网格坐标: '${params.gridCoordinate}'，格式应为 x{1-50}y{1-50}，如 x25y25`,
      });
    }
    // 图形以网格中心为锚点放置，需要偏移到左上角
    x = resolved.x - nodeWidth / 2;
    y = resolved.y - nodeHeight / 2;
  } else if (params.position) {
    const resolved = resolvePosition(params.position, nodeWidth, nodeHeight);
    x = resolved.x;
    y = resolved.y;
  } else {
    x = params.x ?? 0;
    y = params.y ?? 0;
  }

  const node: Node = {
    id,
    type: params.type as Node["type"],
    x,
    y,
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
export function query_canvas_state(_params?: unknown): string {
  try {
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
  } catch (err) {
    return JSON.stringify({
      success: false,
      errorMessage: `查询失败: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

/**
 * 生成 AI 图像
 * 对应 PRD Tool 7: generate_image
 *
 * 异步流程：
 * 1. 插入 "Loading..." 占位文本节点（立即渲染，给用户视觉反馈）
 * 2. 调用图像生成 API（当前为 picsum.photos 占位）
 * 3. 成功后将占位节点替换为真正的图像节点
 */
export function generate_image(params: {
  prompt: string;
  style?: ImageStyle;
  position?: SpatialPosition;
  width?: number;
  height?: number;
}): string {
  const store = getStore();
  const id = nextId("image");
  const imgWidth = params.width ?? 300;
  const imgHeight = params.height ?? 300;

  // 解析坐标
  let x: number;
  let y: number;
  if (params.position) {
    const resolved = resolvePosition(params.position, imgWidth, imgHeight);
    x = resolved.x;
    y = resolved.y;
  } else {
    // 默认居中
    const resolved = resolvePosition("center", imgWidth, imgHeight);
    x = resolved.x;
    y = resolved.y;
  }

  // 1. 插入占位文本节点（"Loading..."）
  const placeholderNode: Node = {
    id,
    type: "text",
    x,
    y,
    rotation: 0,
    fill: "#9E9E9E",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 0.8,
    text: `⏳ 正在生成: ${params.prompt}`,
    fontSize: 14,
    fontFamily: "Arial",
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
      name: `图像_${params.prompt.slice(0, 10)}`,
    },
  };

  const addResult = store.addNode(placeholderNode);

  // 2. 异步调用图像生成 API
  generateImage({
    prompt: params.prompt,
    style: params.style,
    width: imgWidth,
    height: imgHeight,
  }).then((result) => {
    if (result.success && result.imageUrl) {
      // 3a. 成功：将占位节点替换为图像节点
      store.updateNode(id, {
        type: "image",
        imageUrl: result.imageUrl,
        text: undefined, // 清除文本
        width: imgWidth,
        height: imgHeight,
        fill: "transparent",
        opacity: 1,
      });
    } else {
      // 3b. 失败：更新占位节点显示错误信息
      store.updateNode(id, {
        text: `❌ 生成失败: ${result.error ?? "未知错误"}`,
        fill: "#F44336",
      });
    }
  });

  // 立即返回占位节点信息（不等待图像生成完成）
  return JSON.stringify({
    ...addResult,
    message: `正在生成图像: "${params.prompt}"，请稍候...`,
  });
}

// ─── 工具注册表 ──────────────────────────────────────────────

/**
 * 几何约束对齐
 *
 * V2.0 新增工具：使用 Kiwi.js 约束求解器处理复杂的空间对齐关系。
 * LLM 只需声明语义关系（如"紧贴右侧"），前端精确计算像素坐标。
 *
 * 支持的 relation 枚举值：
 * - leftOf:      target 的右边缘紧贴 reference 的左边缘
 * - rightOf:     target 的左边缘紧贴 reference 的右边缘
 * - alignTop:    target 与 reference 顶部对齐
 * - alignCenter: target 与 reference 中心对齐
 */
export function align_objects(params: {
  targetNodeId: string;
  referenceNodeId: string;
  relation: AlignmentRelation;
  offset?: number;
}): string {
  const store = getStore();
  const result = store.alignNode(
    params.targetNodeId,
    params.referenceNodeId,
    params.relation,
    params.offset ?? 0
  );
  return JSON.stringify(result);
}

/**
 * 生成复杂图形模板
 *
 * 使用预定义的 SVG Path 模板渲染复杂图形。
 * 支持 15+ 种模板：star, heart, arrow, chat_bubble, hexagon, octagon,
 * diamond, cross, lightning, shield, cloud, crescent, music_note, infinity, hash
 *
 * 支持中文名：星星, 爱心, 箭头, 对话框, 六边形, 菱形, 闪电, 盾牌, 云朵, 月亮, 音符 等
 */
export function generate_template(params: {
  template: string;
  gridCoordinate?: string;
  x?: number;
  y?: number;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  name?: string;
}): string {
  const store = getStore();

  // 解析坐标（优先 gridCoordinate）
  let cx: number;
  let cy: number;

  if (params.gridCoordinate) {
    const resolved = resolveGridCoordinate(
      params.gridCoordinate,
      _canvasWidth,
      _canvasHeight,
      true
    );
    if (!resolved) {
      return JSON.stringify({
        success: false,
        errorCode: "INVALID_PARAMS",
        errorMessage: `无效的网格坐标: '${params.gridCoordinate}'`,
      });
    }
    cx = resolved.x;
    cy = resolved.y;
  } else {
    cx = params.x ?? _canvasWidth / 2;
    cy = params.y ?? _canvasHeight / 2;
  }

  // 生成模板
  const result = generateTemplate(params.template, {
    cx, cy,
    size: params.size,
    fill: params.fill,
    stroke: params.stroke,
    strokeWidth: params.strokeWidth,
    rotation: params.rotation,
  });

  if (!result) {
    return JSON.stringify({
      success: false,
      errorCode: "INVALID_PARAMS",
      errorMessage: `未知模板: '${params.template}'。可用模板: star, heart, arrow, chat_bubble, hexagon, octagon, diamond, cross, lightning, shield, cloud, crescent, music_note, infinity, hash`,
    });
  }

  // 创建 path 节点
  const id = nextId("path");
  const node: Node = {
    id,
    type: "path",
    x: result.x,
    y: result.y,
    width: result.width,
    height: result.height,
    rotation: result.rotation,
    fill: result.fill,
    stroke: result.stroke,
    strokeWidth: result.strokeWidth,
    opacity: 1,
    pathData: result.pathData,
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
      name: params.name ?? result.name,
    },
    // 渐变和阴影（如果模板定义了）
    fillGradient: result.fillGradient,
    shadow: result.shadow,
  };

  const addResult = store.addNode(node);
  return JSON.stringify(addResult);
}

/**
 * 单次 SVG 全量生成
 *
 * LLM 一次性输出完整的 SVG Path 数据（d 属性），前端直接渲染。
 * 不拆分、不多次调用，一个调用 = 一个完整的矢量图形。
 *
 * 适用场景：复杂有机形状（动物、人物、食物等）
 *
 * SVG Path 命令参考：
 * M x,y — 移动画笔
 * L x,y — 直线
 * Q cx,cy x,y — 二次贝塞尔曲线
 * C cx1,cy1 cx2,cy2 x,y — 三次贝塞尔曲线
 * A rx,ry rotation large-arc sweep x,y — 弧线
 * Z — 闭合路径
 *
 * 坐标系：以 (0,0) 为左上角，画布 500x500 像素。
 * LLM 应在 0-500 范围内绘制。
 */
export function generate_svg(params: {
  pathData: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  gridCoordinate?: string;
  name?: string;
}): string {
  const store = getStore();

  if (!params.pathData || params.pathData.trim().length === 0) {
    return JSON.stringify({
      success: false,
      errorCode: "INVALID_PARAMS",
      errorMessage: "pathData 不能为空",
    });
  }

  // 计算路径的边界框（简化：取路径中的坐标极值）
  const bbox = estimateSvgBBox(params.pathData);
  const pathWidth = bbox.maxX - bbox.minX;
  const pathHeight = bbox.maxY - bbox.minY;

  // 解析放置位置（优先 gridCoordinate，否则居中）
  let placeX: number;
  let placeY: number;

  if (params.gridCoordinate) {
    const resolved = resolveGridCoordinate(
      params.gridCoordinate,
      _canvasWidth,
      _canvasHeight,
      true
    );
    if (!resolved) {
      return JSON.stringify({
        success: false,
        errorCode: "INVALID_PARAMS",
        errorMessage: `无效的网格坐标: '${params.gridCoordinate}'`,
      });
    }
    // 图形以网格中心对齐，需要偏移到左上角
    placeX = resolved.x - pathWidth / 2;
    placeY = resolved.y - pathHeight / 2;
  } else {
    // 默认居中
    placeX = (_canvasWidth - pathWidth) / 2;
    placeY = (_canvasHeight - pathHeight) / 2;
  }

  // 偏移路径数据，将路径从其自身坐标系平移到画布位置
  const offsetX = placeX - bbox.minX;
  const offsetY = placeY - bbox.minY;
  const adjustedPath = offsetSvgPath(params.pathData, offsetX, offsetY);

  // 创建 path 节点
  const id = nextId("svg");
  const node: Node = {
    id,
    type: "path",
    x: placeX,
    y: placeY,
    width: pathWidth,
    height: pathHeight,
    rotation: 0,
    fill: params.fill ?? "transparent",
    stroke: params.stroke ?? "#000000",
    strokeWidth: params.strokeWidth ?? 2,
    opacity: 1,
    pathData: adjustedPath,
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
      name: params.name ?? `SVG_${store.nodeCount + 1}`,
    },
  };

  const addResult = store.addNode(node);
  return JSON.stringify(addResult);
}

/**
 * 估算 SVG Path 的边界框
 * 从路径数据中提取所有坐标点，计算最小/最大值
 */
function estimateSvgBBox(pathData: string): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  // 匹配所有数字（包括负数和小数）
  const numbers = pathData.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 简化处理：将数字两两配对为 (x, y) 坐标
  // 注意：这不处理弧线命令的参数，但对边界框估算足够
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = numbers[i];
    const y = numbers[i + 1];
    if (isFinite(x)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (isFinite(y)) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  // 如果没有有效坐标，返回默认值
  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  return { minX, minY, maxX, maxY };
}

/**
 * 平移 SVG Path 数据中的所有坐标
 * 简化处理：将数字两两配对为 (x, y) 并加上偏移量
 */
function offsetSvgPath(pathData: string, offsetX: number, offsetY: number): string {
  // SVG 路径命令字母
  const commands = "MmLlHhVvCcSsQqTtAaZz";

  let result = "";
  let numIdx = 0;
  let currentCommand = "";

  // 逐字符解析
  let i = 0;
  while (i < pathData.length) {
    const ch = pathData[i];

    if (commands.includes(ch)) {
      currentCommand = ch;
      result += ch;
      i++;
      numIdx = 0;
      continue;
    }

    if (ch === "-" || ch === "." || (ch >= "0" && ch <= "9")) {
      // 读取完整数字
      let numStr = "";
      while (i < pathData.length && (pathData[i] === "-" || pathData[i] === "." || (pathData[i] >= "0" && pathData[i] <= "9"))) {
        numStr += pathData[i];
        i++;
      }
      const num = parseFloat(numStr);

      // 判断是否需要偏移
      const upperCmd = currentCommand.toUpperCase();
      let adjusted = num;

      if (upperCmd === "A") {
        // 弧线命令：参数顺序为 rx ry x-rotation large-arc sweep x y
        // 只偏移第6和第7个参数（x, y）
        if (numIdx === 5) adjusted = num + offsetX; // x
        if (numIdx === 6) adjusted = num + offsetY; // y
      } else if (upperCmd === "H") {
        // 水平线：只有 x
        adjusted = num + offsetX;
      } else if (upperCmd === "V") {
        // 垂直线：只有 y
        adjusted = num + offsetY;
      } else if (upperCmd === "Z") {
        // 闭合：无参数
      } else {
        // 其他命令：偶数索引偏移 x，奇数索引偏移 y
        if (numIdx % 2 === 0) {
          adjusted = num + offsetX;
        } else {
          adjusted = num + offsetY;
        }
      }

      result += adjusted.toFixed(1);
      numIdx++;
      continue;
    }

    // 其他字符（空格、逗号等）
    result += ch;
    i++;
  }

  return result;
}

/**
 * 语义搜索矢量图标
 *
 * 内置 100+ 常用 Lucide 图标，支持中英文关键词搜索。
 * 搜索结果包含 SVG path data，可直接渲染为矢量图形。
 */
export function search_icon(params: {
  query: string;
  gridCoordinate?: string;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  name?: string;
}): string {
  const store = getStore();
  const results = searchIcons(params.query, 1);

  if (results.length === 0) {
    return JSON.stringify({
      success: false,
      errorCode: "NOT_FOUND",
      errorMessage: `未找到匹配 "${params.query}" 的图标`,
    });
  }

  const icon = results[0].icon;

  // 解析坐标
  let cx: number;
  let cy: number;
  if (params.gridCoordinate) {
    const resolved = resolveGridCoordinate(
      params.gridCoordinate,
      _canvasWidth,
      _canvasHeight,
      true
    );
    if (!resolved) {
      return JSON.stringify({
        success: false,
        errorCode: "INVALID_PARAMS",
        errorMessage: `无效的网格坐标: '${params.gridCoordinate}'`,
      });
    }
    cx = resolved.x;
    cy = resolved.y;
  } else {
    cx = _canvasWidth / 2;
    cy = _canvasHeight / 2;
  }

  // 计算图标尺寸和位置（24x24 viewBox 缩放到指定 size）
  const size = params.size ?? 100;
  const scale = size / 24;
  const x = cx - size / 2;
  const y = cy - size / 2;

  // 缩放 path data
  const scaledPath = scaleSvgPath(icon.pathData, scale);

  // 创建 path 节点
  const id = nextId("icon");
  const node: Node = {
    id,
    type: "path",
    x,
    y,
    width: size,
    height: size,
    rotation: 0,
    fill: params.fill ?? "transparent",
    stroke: params.stroke ?? "#333333",
    strokeWidth: params.strokeWidth ?? 2,
    opacity: 1,
    pathData: scaledPath,
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
      name: params.name ?? icon.name,
    },
  };

  const addResult = store.addNode(node);
  return JSON.stringify(addResult);
}

/**
 * 缩放 SVG Path 数据中的所有坐标
 */
function scaleSvgPath(pathData: string, scale: number): string {
  const commands = "MmLlHhVvCcSsQqTtAaZz";
  let result = "";
  let numIdx = 0;
  let currentCommand = "";
  let i = 0;

  while (i < pathData.length) {
    const ch = pathData[i];

    if (commands.includes(ch)) {
      currentCommand = ch;
      result += ch;
      i++;
      numIdx = 0;
      continue;
    }

    if (ch === "-" || ch === "." || (ch >= "0" && ch <= "9")) {
      let numStr = "";
      while (i < pathData.length && (pathData[i] === "-" || pathData[i] === "." || (pathData[i] >= "0" && pathData[i] <= "9"))) {
        numStr += pathData[i];
        i++;
      }
      const num = parseFloat(numStr);
      result += (num * scale).toFixed(1);
      numIdx++;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * 导出所有工具的映射表，供 ElevenLabs clientTools 配置使用
 */
export function getCanvasTools(): Record<string, (params: any) => string> {
  return {
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
  };
}
