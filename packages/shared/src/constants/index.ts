/**
 * VDC 全局常量
 */

// ─── 画布默认值 ──────────────────────────────────────────────

export const CANVAS_DEFAULTS = {
  width: 1200,
  height: 800,
  background: "#FFFFFF",
  maxNodes: 1000,
  maxImages: 20,
  maxImageSizeMB: 5,
  imageGenResolution: 1024,
} as const;

// ─── 视口约束 ────────────────────────────────────────────────

export const VIEWPORT_CONSTRAINTS = {
  minScale: 0.1,
  maxScale: 10,
  maxCanvasWidth: 8000,
  maxCanvasHeight: 8000,
} as const;

// ─── 节点约束 ────────────────────────────────────────────────

export const NODE_CONSTRAINTS = {
  minSize: 10,
  maxFontSize: 200,
  minFontSize: 12,
  maxTextLength: 2000,
  maxRotation: 360,
  maxSelectedNodes: 20,
  coordinatePrecision: 1,
} as const;

// ─── History Stack ───────────────────────────────────────────

export const HISTORY_LIMITS = {
  maxSteps: 50,
  maxStepSizeKB: 50,
  maxTotalMemoryMB: 2,
  maxActionLogLength: 1000,
} as const;

// ─── 性能目标 ────────────────────────────────────────────────

export const PERFORMANCE_TARGETS = {
  voiceE2ELatencyP95Ms: 1500,
  voiceE2ELatencyP50Ms: 800,
  konvaFPS_10nodes: 60,
  konvaFPS_100nodes: 45,
  konvaFPS_1000nodes: 30,
  jsonSerialize100nodesMs: 50,
  jsonSerialize1000nodesMs: 300,
} as const;

// ─── 超时配置 ────────────────────────────────────────────────

export const TIMEOUTS = {
  singleToolExecutionMs: 5000,
  chainTotalMs: 30000,
  llmSingleRoundMs: 10000,
  imageGenSoftTimeoutMs: 15000,
  imageGenHardTimeoutMs: 60000,
  confirmTimeoutMs: 10000,
  saveDebounceMs: 3000,
  syncIntervalMs: 30000,
  wsHeartbeatMs: 15000,
} as const;

// ─── 语音纠错映射 ───────────────────────────────────────────

export const COLOR_CORRECTIONS: Record<string, string> = {
  赛恩: "cyan",
  赛因: "cyan",
  马真塔: "magenta",
  品红: "magenta",
  贝奇: "beige",
  贝吉: "beige",
  珊瑚: "coral",
  山瑚: "coral",
  萨蒙: "salmon",
  三文鱼: "salmon",
  绿松石: "turquoise",
  土耳其: "turquoise",
  靛青: "indigo",
  靛蓝: "indigo",
  栗色: "maroon",
  深红: "maroon",
  藏青: "navy",
  海军蓝: "navy",
  橄榄: "olive",
  橄榄绿: "olive",
};

export const SHAPE_CORRECTIONS: Record<string, string> = {
  矩形: "rect",
  举行: "rect",
  巨型: "rect",
  圆形: "circle",
  元形: "circle",
  原形: "circle",
  直线: "line",
  值线: "line",
  支线: "line",
  文本: "text",
  文奔: "text",
  问本: "text",
  图片: "image",
  图骗: "image",
  涂片: "image",
  以利普斯: "ellipse",
  椭圆型: "ellipse",
  泡利贡: "polygon",
  多边型: "polygon",
};

export const CSS_CORRECTIONS: Record<string, string> = {
  透明度: "opacity",
  偷明度: "opacity",
  描边: "strokeWidth",
  苗边: "strokeWidth",
  描变: "strokeWidth",
  填充: "fill",
  甜充: "fill",
  天充: "fill",
  旋转: "rotation",
  选转: "rotation",
  悬转: "rotation",
  圆角: "cornerRadius",
  元角: "cornerRadius",
  远角: "cornerRadius",
};

// ─── 网格密度 ────────────────────────────────────────────────

export const GRID_DENSITIES = [10, 20, 50] as const;
