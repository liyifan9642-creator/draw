/**
 * Shape Templates — 复杂图形模板系统
 *
 * 将常用复杂图形定义为 SVG Path 数据。
 * LLM 调用 generate_template 工具时，前端根据模板名查找路径并渲染。
 *
 * 所有模板坐标以 (cx, cy) 为中心，size 为整体尺寸（直径）。
 * 生成的 pathData 是相对坐标，Node 的 x/y 作为偏移。
 */

import { generateComplexTemplate } from "./complexTemplates";

// ─── 类型 ────────────────────────────────────────────────────

export interface TemplateParams {
  /** 中心 x 坐标 */
  cx: number;
  /** 中心 y 坐标 */
  cy: number;
  /** 整体尺寸（直径），默认 100 */
  size?: number;
  /** 填充色 */
  fill?: string;
  /** 描边色 */
  stroke?: string;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 旋转角度 */
  rotation?: number;
}

export interface TemplateResult {
  /** 模板显示名 */
  name: string;
  /** SVG 路径数据 */
  pathData: string;
  /** 填充色 */
  fill: string;
  /** 描边色 */
  stroke: string;
  /** 描边宽度 */
  strokeWidth: number;
  /** 节点 x 坐标（左上角） */
  x: number;
  /** 节点 y 坐标（左上角） */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 旋转 */
  rotation: number;
}

// ─── 模板定义 ─────────────────────────────────────────────────

/**
 * 五角星
 * 5 个外顶点 + 5 个内凹点交替连接
 */
function star(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 2;
  const cx = 0, cy = 0;
  const outerR = s;
  const innerR = s * 0.382;
  const points: string[] = [];

  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = cx + outerR * Math.cos(outerAngle);
    const oy = cy - outerR * Math.sin(outerAngle);
    const ix = cx + innerR * Math.cos(innerAngle);
    const iy = cy - innerR * Math.sin(innerAngle);
    points.push(`${i === 0 ? "M" : "L"}${ox.toFixed(1)},${oy.toFixed(1)}`);
    points.push(`L${ix.toFixed(1)},${iy.toFixed(1)}`);
  }
  points.push("Z");

  return {
    name: "五角星", pathData: points.join(" "),
    fill: p.fill ?? "#FFD700", stroke: p.stroke ?? "#FFA000", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - s, y: p.cy - s, width: s * 2, height: s * 2, rotation: p.rotation ?? 0,
  };
}

/**
 * 爱心
 * 两段贝塞尔曲线构成的经典心形
 */
function heart(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 100;
  const d = [
    "M0,-40",
    "C0,-55 -50,-55 -50,-25",
    "C-50,5 0,30 0,50",
    "C0,30 50,5 50,-25",
    "C50,-55 0,-55 0,-40",
    "Z",
  ].join(" ");

  return {
    name: "爱心", pathData: d,
    fill: p.fill ?? "#E91E63", stroke: p.stroke ?? "#C2185B", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 50 * s, y: p.cy - 55 * s, width: 100 * s, height: 105 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 右箭头
 * 水平矩形箭杆 + 三角形箭头
 */
function arrow(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 120) / 120;
  const d = [
    "M-60,-15 L10,-15 L10,-35 L60,0 L10,35 L10,15 L-60,15 Z",
  ].join(" ");

  return {
    name: "箭头", pathData: d,
    fill: p.fill ?? "#2196F3", stroke: p.stroke ?? "#1565C0", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 60 * s, y: p.cy - 35 * s, width: 120 * s, height: 70 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 对话气泡
 * 圆角矩形 + 底部小三角
 */
function chat_bubble(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 120) / 120;
  const d = [
    "M-50,-35 Q-50,-45 -40,-45 L40,-45 Q50,-45 50,-35 L50,15 Q50,25 40,25 L0,25 L-15,40 L-5,25 L-40,25 Q-50,25 -50,15 Z",
  ].join(" ");

  return {
    name: "对话气泡", pathData: d,
    fill: p.fill ?? "#E3F2FD", stroke: p.stroke ?? "#90CAF9", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 50 * s, y: p.cy - 45 * s, width: 100 * s, height: 85 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 六边形
 */
function hexagon(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 2;
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 6) + (i * Math.PI / 3);
    const x = s * Math.cos(angle);
    const y = -s * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  points.push("Z");

  return {
    name: "六边形", pathData: points.join(" "),
    fill: p.fill ?? "#4CAF50", stroke: p.stroke ?? "#2E7D32", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - s, y: p.cy - s, width: s * 2, height: s * 2, rotation: p.rotation ?? 0,
  };
}

/**
 * 八边形（停止标志）
 */
function octagon(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 2;
  const a = s * 0.414; // tan(22.5°) * s
  const d = [
    `M${-a.toFixed(1)},${-s.toFixed(1)}`,
    `L${a.toFixed(1)},${-s.toFixed(1)}`,
    `L${s.toFixed(1)},${-a.toFixed(1)}`,
    `L${s.toFixed(1)},${a.toFixed(1)}`,
    `L${a.toFixed(1)},${s.toFixed(1)}`,
    `L${-a.toFixed(1)},${s.toFixed(1)}`,
    `L${-s.toFixed(1)},${a.toFixed(1)}`,
    `L${-s.toFixed(1)},${-a.toFixed(1)}`,
    "Z",
  ].join(" ");

  return {
    name: "八边形", pathData: d,
    fill: p.fill ?? "#F44336", stroke: p.stroke ?? "#C62828", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - s, y: p.cy - s, width: s * 2, height: s * 2, rotation: p.rotation ?? 0,
  };
}

/**
 * 菱形
 */
function diamond(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 2;
  const d = `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;

  return {
    name: "菱形", pathData: d,
    fill: p.fill ?? "#9C27B0", stroke: p.stroke ?? "#6A1B9A", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - s, y: p.cy - s, width: s * 2, height: s * 2, rotation: p.rotation ?? 0,
  };
}

/**
 * 十字架
 */
function cross(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 2;
  const w = s * 0.3;
  const d = [
    `M${-w},${-s} L${w},${-s} L${w},${-w} L${s},${-w}`,
    `L${s},${w} L${w},${w} L${w},${s} L${-w},${s}`,
    `L${-w},${w} L${-s},${w} L${-s},${-w} L${-w},${-w} Z`,
  ].join(" ");

  return {
    name: "十字", pathData: d,
    fill: p.fill ?? "#FF5722", stroke: p.stroke ?? "#D84315", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - s, y: p.cy - s, width: s * 2, height: s * 2, rotation: p.rotation ?? 0,
  };
}

/**
 * 闪电
 */
function lightning(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 100;
  const d = "M5,-50 L-20,0 L5,0 L-5,50 L25,-5 L-5,-5 Z";

  return {
    name: "闪电", pathData: d,
    fill: p.fill ?? "#FFC107", stroke: p.stroke ?? "#FF8F00", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 20 * s, y: p.cy - 50 * s, width: 45 * s, height: 100 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 盾牌
 */
function shield(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 100;
  const d = "M0,-50 L45,-35 L40,0 L25,35 L0,50 L-25,35 L-40,0 L-45,-35 Z";

  return {
    name: "盾牌", pathData: d,
    fill: p.fill ?? "#3F51B5", stroke: p.stroke ?? "#283593", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 45 * s, y: p.cy - 50 * s, width: 90 * s, height: 100 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 云朵
 */
function cloud(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 120) / 120;
  const d = [
    "M-30,10",
    "C-50,10 -50,-15 -35,-20",
    "C-35,-40 -5,-45 5,-30",
    "C15,-50 45,-40 45,-20",
    "C60,-15 55,5 40,10",
    "Z",
  ].join(" ");

  return {
    name: "云朵", pathData: d,
    fill: p.fill ?? "#ECEFF1", stroke: p.stroke ?? "#B0BEC5", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 55 * s, y: p.cy - 45 * s, width: 110 * s, height: 55 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 月亮/新月
 */
function crescent(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 100;
  const d = [
    "M15,-45",
    "A45,45 0 1,0 15,45",
    "A30,30 0 1,1 15,-45",
    "Z",
  ].join(" ");

  return {
    name: "月亮", pathData: d,
    fill: p.fill ?? "#FFF9C4", stroke: p.stroke ?? "#F9A825", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 45 * s, y: p.cy - 45 * s, width: 90 * s, height: 90 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 音符
 */
function music_note(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 100;
  const d = [
    "M-10,-45 L-10,20",
    "C-10,35 -35,35 -35,20",
    "C-35,5 -10,5 -10,20",
    "M-10,-45 L25,-35 L25,-15 L-10,-25",
  ].join(" ");

  return {
    name: "音符", pathData: d,
    fill: p.fill ?? "#7B1FA2", stroke: p.stroke ?? "#4A148C", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 35 * s, y: p.cy - 45 * s, width: 60 * s, height: 80 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 无限符号 ∞
 */
function infinity(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 120) / 120;
  const d = [
    "M0,0",
    "C0,-20 25,-20 25,0",
    "C25,20 0,20 0,0",
    "C0,-20 -25,-20 -25,0",
    "C-25,20 0,20 0,0",
  ].join(" ");

  return {
    name: "无限", pathData: d,
    fill: "transparent", stroke: p.stroke ?? "#00BCD4", strokeWidth: p.strokeWidth ?? 3,
    x: p.cx - 25 * s, y: p.cy - 20 * s, width: 50 * s, height: 40 * s, rotation: p.rotation ?? 0,
  };
}

/**
 * 网格/井号 #
 */
function hash(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 100) / 100;
  const d = [
    "M-20,-40 L-8,-40 L-8,-20 L8,-20 L8,-40 L20,-40",
    "L20,-28 L8,-28 L8,-8 L20,-8 L20,4 L8,4",
    "L8,20 L20,20 L20,32 L8,32 L8,40 L-8,40",
    "L-8,32 L-20,32 L-20,20 L-8,20 L-8,4 L-20,4",
    "L-20,-8 L-8,-8 L-8,-28 L-20,-28 Z",
  ].join(" ");

  return {
    name: "井号", pathData: d,
    fill: p.fill ?? "#607D8B", stroke: p.stroke ?? "#37474F", strokeWidth: p.strokeWidth ?? 1,
    x: p.cx - 20 * s, y: p.cy - 40 * s, width: 40 * s, height: 80 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 模板注册表 ───────────────────────────────────────────────

export type TemplateName =
  | "star" | "heart" | "arrow" | "chat_bubble"
  | "hexagon" | "octagon" | "diamond" | "cross"
  | "lightning" | "shield" | "cloud" | "crescent"
  | "music_note" | "infinity" | "hash";

const TEMPLATE_MAP: Record<TemplateName, (p: TemplateParams) => TemplateResult> = {
  star, heart, arrow, chat_bubble,
  hexagon, octagon, diamond, cross,
  lightning, shield, cloud, crescent,
  music_note, infinity, hash,
};

/** 中文名 → 模板名映射 */
const CN_NAME_MAP: Record<string, TemplateName> = {
  "星星": "star", "五角星": "star", "星": "star", "五芒星": "star",
  "爱心": "heart", "心形": "heart", "红心": "heart", "心": "heart",
  "箭头": "arrow", "箭": "arrow", "右箭头": "arrow",
  "对话框": "chat_bubble", "气泡": "chat_bubble", "对话气泡": "chat_bubble", "聊天气泡": "chat_bubble",
  "六边形": "hexagon", "蜂巢": "hexagon",
  "八边形": "octagon", "停止标志": "octagon",
  "菱形": "diamond", "钻石": "diamond",
  "十字": "cross", "加号": "cross", "十字架": "cross",
  "闪电": "lightning", "雷电": "lightning",
  "盾牌": "shield", "防护": "shield",
  "云朵": "cloud", "云": "cloud",
  "月亮": "crescent", "新月": "crescent", "月牙": "crescent",
  "音符": "music_note", "音乐": "music_note",
  "无限": "infinity", "无穷": "infinity", "∞": "infinity",
  "井号": "hash", "#": "hash",
};

// ─── 公开 API ─────────────────────────────────────────────────

/**
 * 获取所有可用模板名（英文）
 */
export function getTemplateNames(): string[] {
  return Object.keys(TEMPLATE_MAP);
}

/**
 * 获取所有可用模板的中英文名（用于 LLM prompt）
 */
export function getTemplateDescriptions(): Array<{ name: string; aliases: string[] }> {
  const result: Array<{ name: string; aliases: string[] }> = [];
  for (const [en, _fn] of Object.entries(TEMPLATE_MAP)) {
    const aliases = Object.entries(CN_NAME_MAP)
      .filter(([, v]) => v === en)
      .map(([k]) => k);
    result.push({ name: en, aliases });
  }
  return result;
}

/**
 * 解析模板名（支持中文别名）
 */
export function resolveTemplateName(name: string): TemplateName | null {
  const lower = name.toLowerCase().trim();
  if (lower in TEMPLATE_MAP) return lower as TemplateName;
  if (lower in CN_NAME_MAP) return CN_NAME_MAP[lower];
  return null;
}

/**
 * 生成模板图形
 *
 * @param name   模板名（英文或中文）
 * @param params 参数（中心坐标、尺寸、颜色等）
 * @returns 模板结果（含 pathData），或 null（未知模板）
 */
export function generateTemplate(
  name: string,
  params: TemplateParams
): TemplateResult | null {
  // 先查找基础模板
  const resolved = resolveTemplateName(name);
  if (resolved) {
    const fn = TEMPLATE_MAP[resolved];
    return fn(params);
  }

  // 再查找复杂模板
  return generateComplexTemplate(name, params);
}
