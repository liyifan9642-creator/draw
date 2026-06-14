/**
 * Complex SVG Templates — 高质量复杂图形模板库
 *
 * 所有模板使用 500x500 坐标系。
 * SVG 路径由简化但可识别的轮廓组成，确保在各种尺寸下都清晰。
 *
 * 分类：动物、植物、自然、建筑、交通工具、食物、人物、物体
 */

import type { TemplateParams, TemplateResult } from "./templates";

// ─── 动物 ─────────────────────────────────────────────────────

/** 猫 — 卡通风格，坐着的姿态 */
export function cat(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 身体
    "M250,420 C180,420 140,370 140,310 C140,250 180,200 250,200 C320,200 360,250 360,310 C360,370 320,420 250,420",
    // 头
    "M250,200 C200,200 165,170 165,130 C165,90 200,60 250,60 C300,60 335,90 335,130 C335,170 300,200 250,200",
    // 左耳
    "M185,95 L160,40 L210,80",
    // 右耳
    "M315,95 L340,40 L290,80",
    // 左眼
    "M220,120 C215,110 225,100 235,110 C240,115 235,125 225,125 C220,125 218,122 220,120",
    // 右眼
    "M280,120 C275,110 285,100 295,110 C300,115 295,125 285,125 C280,125 278,122 280,120",
    // 鼻子
    "M245,145 L250,150 L255,145",
    // 嘴
    "M240,155 C245,160 255,160 260,155",
    // 胡须左
    "M230,148 L180,140 M230,152 L180,155",
    // 胡须右
    "M270,148 L320,140 M270,152 L320,155",
    // 尾巴
    "M360,350 C400,340 420,300 410,260 C405,240 390,230 380,240",
  ].join(" ");

  return {
    name: "猫", pathData: d,
    fill: p.fill ?? "#FFD54F", stroke: p.stroke ?? "#5D4037", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 狗 — 卡通风格，坐着的姿态 */
export function dog(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 身体
    "M250,430 C170,430 120,370 120,300 C120,230 170,180 250,180 C330,180 380,230 380,300 C380,370 330,430 250,430",
    // 头
    "M250,180 C190,180 150,140 150,100 C150,60 190,30 250,30 C310,30 350,60 350,100 C350,140 310,180 250,180",
    // 左耳（下垂）
    "M170,80 C140,90 110,130 120,170 C125,185 145,180 160,160",
    // 右耳（下垂）
    "M330,80 C360,90 390,130 380,170 C375,185 355,180 340,160",
    // 左眼
    "M215,90 C210,80 220,70 230,80 C235,85 230,95 220,95",
    // 右眼
    "M285,90 C280,80 290,70 300,80 C305,85 300,95 290,95",
    // 鼻子
    "M240,115 L250,125 L260,115",
    // 嘴
    "M235,130 C240,140 260,140 265,130",
    // 舌头
    "M248,140 C245,155 255,155 252,140",
    // 尾巴
    "M380,300 C410,280 430,250 420,220",
  ].join(" ");

  return {
    name: "狗", pathData: d,
    fill: p.fill ?? "#A1887F", stroke: p.stroke ?? "#4E342E", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 鸟 — 侧面站立 */
export function bird(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 身体
    "M200,280 C160,260 140,230 150,200 C160,170 200,150 250,150 C300,150 340,170 350,200 C360,230 340,260 300,280",
    // 头
    "M340,190 C360,170 380,160 390,170 C400,180 395,200 380,210 C365,220 345,210 340,190",
    // 眼睛
    "M375,185 C372,180 378,175 382,180",
    // 嘴
    "M390,185 L420,180 L390,195",
    // 翅膀
    "M200,200 C170,180 130,190 120,220 C115,235 130,250 160,240",
    // 尾巴
    "M150,250 C120,260 90,280 100,300 C105,310 120,305 140,290",
    // 左脚
    "M230,280 L220,330 L200,340 M220,330 L240,340 M220,330 L220,350",
    // 右脚
    "M280,280 L290,330 L270,340 M290,330 L310,340 M290,330 L290,350",
  ].join(" ");

  return {
    name: "鸟", pathData: d,
    fill: p.fill ?? "#42A5F5", stroke: p.stroke ?? "#1565C0", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 鱼 — 游泳姿态 */
export function fish(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 身体
    "M150,250 C150,180 220,120 320,120 C400,120 440,180 440,250 C440,320 400,380 320,380 C220,380 150,320 150,250",
    // 尾巴
    "M150,250 L80,180 L80,320 Z",
    // 背鳍
    "M280,120 C270,80 310,60 330,90 C340,100 320,110 310,120",
    // 胸鳍
    "M300,280 C280,310 260,330 250,310 C245,300 260,280 280,270",
    // 眼睛
    "M380,210 C375,200 385,190 390,200 C395,205 390,215 385,215",
    // 嘴
    "M440,250 C450,245 450,255 440,250",
    // 鳞片纹理
    "M250,180 C260,170 280,170 290,180 M300,200 C310,190 330,190 340,200 M280,250 C290,240 310,240 320,250",
  ].join(" ");

  return {
    name: "鱼", pathData: d,
    fill: p.fill ?? "#FF7043", stroke: p.stroke ?? "#D84315", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 兔子 — 站立 */
export function rabbit(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 身体
    "M250,430 C190,430 150,380 150,320 C150,260 190,220 250,220 C310,220 350,260 350,320 C350,380 310,430 250,430",
    // 头
    "M250,220 C200,220 170,190 170,150 C170,110 200,80 250,80 C300,80 330,110 330,150 C330,190 300,220 250,220",
    // 左耳
    "M210,80 C200,40 190,10 200,5 C210,0 220,30 225,70",
    // 右耳
    "M290,80 C300,40 310,10 300,5 C290,0 280,30 275,70",
    // 左耳内
    "M212,70 C207,45 200,25 205,20 C208,18 212,35 215,60",
    // 右耳内
    "M288,70 C293,45 300,25 295,20 C292,18 288,35 285,60",
    // 左眼
    "M225,135 C220,125 230,115 240,125 C245,130 240,140 230,140",
    // 右眼
    "M275,135 C270,125 280,115 290,125 C295,130 290,140 280,140",
    // 鼻子
    "M245,160 L250,165 L255,160",
    // 嘴
    "M240,170 C245,175 255,175 260,170",
    // 尾巴
    "M250,430 C240,450 260,460 250,430",
  ].join(" ");

  return {
    name: "兔子", pathData: d,
    fill: p.fill ?? "#E0E0E0", stroke: p.stroke ?? "#757575", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 蝴蝶 */
export function butterfly(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 左上翅
    "M250,250 C200,180 100,150 80,200 C60,250 120,300 200,280",
    // 右上翅
    "M250,250 C300,180 400,150 420,200 C440,250 380,300 300,280",
    // 左下翅
    "M250,250 C210,290 140,330 130,300 C120,270 170,260 220,260",
    // 右下翅
    "M250,250 C290,290 360,330 370,300 C380,270 330,260 280,260",
    // 身体
    "M245,200 L250,180 L255,200 L255,320 L250,340 L245,320 Z",
    // 左触角
    "M248,200 C230,170 210,150 200,140",
    // 右触角
    "M252,200 C270,170 290,150 300,140",
    // 翅膀花纹
    "M180,220 C170,210 160,220 170,230",
    "M320,220 C330,210 340,220 330,230",
  ].join(" ");

  return {
    name: "蝴蝶", pathData: d,
    fill: p.fill ?? "#CE93D8", stroke: p.stroke ?? "#6A1B9A", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 植物 ─────────────────────────────────────────────────────

/** 树 — 阔叶树 */
export function tree(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 树干
    "M230,450 L230,280 L270,280 L270,450",
    // 树冠
    "M250,280 C180,270 100,230 100,170 C100,100 160,50 250,40 C340,50 400,100 400,170 C400,230 320,270 250,280",
    // 树枝
    "M230,350 C200,340 170,350 160,370",
    "M270,330 C300,320 330,330 340,350",
    // 树叶纹理
    "M180,150 C190,140 210,140 220,150",
    "M280,150 C290,140 310,140 320,150",
    "M200,200 C210,190 230,190 240,200",
    "M260,200 C270,190 290,190 300,200",
  ].join(" ");

  return {
    name: "树", pathData: d,
    fill: p.fill ?? "#66BB6A", stroke: p.stroke ?? "#2E7D32", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 花 — 向日葵 */
export function flower(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 茎
    "M250,450 L250,280",
    // 左叶
    "M250,350 C220,340 180,350 170,370 C165,380 185,380 210,370",
    // 右叶
    "M250,320 C280,310 320,320 330,340 C335,350 315,350 290,340",
    // 花瓣（8片）
    "M250,200 C230,160 220,120 240,110 C250,105 260,110 260,120 C260,140 255,170 250,200",
    "M250,200 C290,180 320,160 330,170 C335,180 320,190 300,200 C280,210 260,210 250,200",
    "M250,200 C280,220 310,240 300,260 C295,270 275,260 260,240 C250,230 250,215 250,200",
    "M250,200 C240,240 220,270 200,260 C190,255 200,240 220,230 C235,220 245,210 250,200",
    "M250,200 C210,220 180,240 170,230 C165,220 180,210 200,200 C220,190 240,195 250,200",
    "M250,200 C220,180 190,160 180,170 C175,180 190,190 210,200 C225,205 240,205 250,200",
    // 花心
    "M250,200 C235,190 230,175 240,170 C250,165 260,170 265,180 C270,190 260,200 250,200",
  ].join(" ");

  return {
    name: "花", pathData: d,
    fill: p.fill ?? "#FDD835", stroke: p.stroke ?? "#F57F17", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 蘑菇 */
export function mushroom(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 菌盖
    "M100,250 C100,150 170,80 250,80 C330,80 400,150 400,250 C400,260 380,270 350,270 L150,270 C120,270 100,260 100,250",
    // 菌柄
    "M200,270 L200,400 C200,420 220,430 250,430 C280,430 300,420 300,400 L300,270",
    // 菌盖斑点
    "M200,150 C190,140 185,125 195,120 C205,115 215,125 210,135 C208,140 205,145 200,150",
    "M300,150 C290,140 285,125 295,120 C305,115 315,125 310,135 C308,140 305,145 300,150",
    "M250,120 C240,110 235,95 245,90 C255,85 265,95 260,105 C258,110 255,115 250,120",
  ].join(" ");

  return {
    name: "蘑菇", pathData: d,
    fill: p.fill ?? "#EF5350", stroke: p.stroke ?? "#B71C1C", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 自然 ─────────────────────────────────────────────────────

/** 太阳 */
export function sun(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const rays: string[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const innerR = 120;
    const outerR = 200;
    const x1 = 250 + innerR * Math.cos(angle);
    const y1 = 250 + innerR * Math.sin(angle);
    const x2 = 250 + outerR * Math.cos(angle);
    const y2 = 250 + outerR * Math.sin(angle);
    rays.push(`M${x1.toFixed(0)},${y1.toFixed(0)} L${x2.toFixed(0)},${y2.toFixed(0)}`);
  }
  const d = [
    // 圆形
    "M250,130 C316,130 370,184 370,250 C370,316 316,370 250,370 C184,370 130,316 130,250 C130,184 184,130 250,130",
    // 光线
    ...rays,
  ].join(" ");

  return {
    name: "太阳", pathData: d,
    fill: p.fill ?? "#FFD600", stroke: p.stroke ?? "#F57F17", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 山 */
export function mountain(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 主山
    "M50,450 L250,100 L450,450",
    // 左小山
    "M50,450 L150,250 L250,450",
    // 雪顶
    "M220,160 L250,100 L280,160 L265,170 L250,150 L235,170 Z",
  ].join(" ");

  return {
    name: "山", pathData: d,
    fill: p.fill ?? "#78909C", stroke: p.stroke ?? "#37474F", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 建筑 ─────────────────────────────────────────────────────

/** 房子 */
export function house(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 墙壁
    "M120,450 L120,250 L380,250 L380,450",
    // 屋顶
    "M100,250 L250,100 L400,250",
    // 门
    "M220,450 L220,340 L280,340 L280,450",
    // 左窗
    "M150,300 L150,360 L200,360 L200,300 M175,300 L175,360 M150,330 L200,330",
    // 右窗
    "M300,300 L300,360 L350,360 L350,300 M325,300 L325,360 M300,330 L350,330",
    // 烟囱
    "M320,180 L320,120 L350,120 L350,200",
  ].join(" ");

  return {
    name: "房子", pathData: d,
    fill: p.fill ?? "#FFCC80", stroke: p.stroke ?? "#5D4037", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 交通工具 ─────────────────────────────────────────────────

/** 汽车 */
export function car(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 车身
    "M80,350 L80,280 L120,280 L180,200 L350,200 L400,280 L420,280 L420,350",
    // 车顶
    "M180,200 L200,150 L320,150 L350,200",
    // 车窗
    "M200,195 L210,160 L260,160 L260,195",
    "M270,195 L270,160 L310,160 L330,195",
    // 左轮
    "M150,350 C150,320 180,300 200,300 C220,300 240,320 240,350 C240,370 220,380 200,380 C180,380 150,370 150,350",
    // 右轮
    "M310,350 C310,320 340,300 360,300 C380,300 400,320 400,350 C400,370 380,380 360,380 C340,380 310,370 310,350",
    // 车灯
    "M80,300 L60,300 L60,320 L80,320",
    "M420,300 L440,300 L440,320 L420,320",
  ].join(" ");

  return {
    name: "汽车", pathData: d,
    fill: p.fill ?? "#EF5350", stroke: p.stroke ?? "#B71C1C", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 船 */
export function boat(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 船体
    "M50,350 L100,400 L400,400 L450,350",
    // 甲板
    "M100,350 L100,320 L400,320 L400,350",
    // 船舱
    "M150,320 L150,260 L350,260 L350,320",
    // 窗户
    "M180,290 L210,290 L210,310 L180,310 M230,290 L260,290 L260,310 L230,310 M280,290 L310,290 L310,310 L280,310",
    // 桅杆
    "M250,260 L250,120",
    // 帆
    "M250,130 L350,200 L250,250",
    // 旗帜
    "M250,120 L290,130 L250,140",
  ].join(" ");

  return {
    name: "船", pathData: d,
    fill: p.fill ?? "#8D6E63", stroke: p.stroke ?? "#3E2723", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 飞机 */
export function airplane(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 机身
    "M80,250 L180,240 L350,240 L420,250 L350,260 L180,260 Z",
    // 机头
    "M80,250 L50,245 L50,255 Z",
    // 左翼
    "M200,240 L150,150 L250,150 L280,240",
    // 右翼
    "M200,260 L150,350 L250,350 L280,260",
    // 尾翼
    "M380,240 L400,200 L420,200 L410,240",
    "M380,260 L400,300 L420,300 L410,260",
    // 窗户
    "M150,248 L160,248 L160,252 L150,252 M180,248 L190,248 L190,252 L180,252 M210,248 L220,248 L220,252 L210,252",
  ].join(" ");

  return {
    name: "飞机", pathData: d,
    fill: p.fill ?? "#E0E0E0", stroke: p.stroke ?? "#616161", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 食物 ─────────────────────────────────────────────────────

/** 苹果 */
export function apple(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 苹果主体
    "M250,400 C180,400 120,350 120,270 C120,190 170,130 250,130 C330,130 380,190 380,270 C380,350 320,400 250,400",
    // 苹果凹陷
    "M230,140 C240,120 260,120 270,140",
    // 茎
    "M250,130 L260,80",
    // 叶子
    "M260,90 C280,70 310,70 320,90 C310,85 285,80 270,90",
    // 高光
    "M200,200 C210,180 230,175 240,185",
  ].join(" ");

  return {
    name: "苹果", pathData: d,
    fill: p.fill ?? "#F44336", stroke: p.stroke ?? "#B71C1C", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 咖啡杯 */
export function coffee_cup(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 杯身
    "M150,200 L170,400 L330,400 L350,200",
    // 杯沿
    "M140,200 L140,180 L360,180 L360,200",
    // 杯底
    "M170,400 L170,420 L330,420 L330,400",
    // 把手
    "M350,230 C390,230 400,270 400,300 C400,330 390,350 360,350",
    // 热气
    "M220,170 C215,150 225,130 220,110",
    "M260,170 C255,145 265,125 260,105",
    "M300,170 C295,150 305,130 300,110",
  ].join(" ");

  return {
    name: "咖啡杯", pathData: d,
    fill: p.fill ?? "#8D6E63", stroke: p.stroke ?? "#4E342E", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 人物 ─────────────────────────────────────────────────────

/** 人物 — 简笔画 */
export function person(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 头
    "M250,80 C280,80 300,100 300,130 C300,160 280,180 250,180 C220,180 200,160 200,130 C200,100 220,80 250,80",
    // 身体
    "M250,180 L250,320",
    // 左臂
    "M250,220 L170,280",
    // 右臂
    "M250,220 L330,280",
    // 左腿
    "M250,320 L180,430",
    // 右腿
    "M250,320 L320,430",
    // 左眼
    "M235,125 C232,118 238,112 242,118",
    // 右眼
    "M265,125 C262,118 268,112 272,118",
    // 嘴
    "M240,150 C245,158 255,158 260,150",
  ].join(" ");

  return {
    name: "人物", pathData: d,
    fill: p.fill ?? "transparent", stroke: p.stroke ?? "#333333", strokeWidth: p.strokeWidth ?? 3,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 物体 ─────────────────────────────────────────────────────

/** 皇冠 */
export function crown(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    "M100,350 L100,200 L180,280 L250,150 L320,280 L400,200 L400,350 Z",
    // 珠宝
    "M180,300 C175,290 185,290 180,300",
    "M250,280 C245,270 255,270 250,280",
    "M320,300 C315,290 325,290 320,300",
    // 底边装饰
    "M100,350 L400,350 L400,370 L100,370 Z",
  ].join(" ");

  return {
    name: "皇冠", pathData: d,
    fill: p.fill ?? "#FFD600", stroke: p.stroke ?? "#F57F17", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 钥匙 */
export function key(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 钥匙头（圆环）
    "M180,200 C180,150 220,110 270,110 C320,110 360,150 360,200 C360,250 320,290 270,290 C220,290 180,250 180,200",
    // 内孔
    "M230,200 C230,175 250,155 270,155 C290,155 310,175 310,200 C310,225 290,245 270,245 C250,245 230,225 230,200",
    // 钥匙杆
    "M270,290 L270,420",
    // 齿
    "M270,380 L300,380 L300,400 L270,400",
    "M270,350 L290,350 L290,370 L270,370",
  ].join(" ");

  return {
    name: "钥匙", pathData: d,
    fill: p.fill ?? "#FFD600", stroke: p.stroke ?? "#F57F17", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

/** 旗帜 */
export function flag(p: TemplateParams): TemplateResult {
  const s = (p.size ?? 200) / 500;
  const d = [
    // 旗杆
    "M120,80 L120,450",
    // 旗帜
    "M120,80 L400,130 L400,280 L120,330",
    // 旗帜波纹
    "M120,130 C200,150 300,120 400,150",
    "M120,230 C200,250 300,220 400,250",
    // 旗杆球
    "M120,80 C115,70 125,70 120,80",
  ].join(" ");

  return {
    name: "旗帜", pathData: d,
    fill: p.fill ?? "#F44336", stroke: p.stroke ?? "#B71C1C", strokeWidth: p.strokeWidth ?? 2,
    x: p.cx - 250 * s, y: p.cy - 250 * s, width: 500 * s, height: 500 * s, rotation: p.rotation ?? 0,
  };
}

// ─── 导出注册表 ───────────────────────────────────────────────

export type ComplexTemplateName =
  | "cat" | "dog" | "bird" | "fish" | "rabbit" | "butterfly"
  | "tree" | "flower" | "mushroom"
  | "sun" | "mountain"
  | "house" | "car" | "boat" | "airplane"
  | "apple" | "coffee_cup"
  | "person" | "crown" | "key" | "flag";

const COMPLEX_TEMPLATE_MAP: Record<ComplexTemplateName, (p: TemplateParams) => TemplateResult> = {
  cat, dog, bird, fish, rabbit, butterfly,
  tree, flower, mushroom,
  sun, mountain,
  house, car, boat, airplane,
  apple, coffee_cup,
  person, crown, key, flag,
};

/** 中文名 → 模板名映射 */
const CN_COMPLEX_MAP: Record<string, ComplexTemplateName> = {
  "猫": "cat", "小猫": "cat", "猫咪": "cat",
  "狗": "dog", "小狗": "dog", "狗狗": "dog",
  "鸟": "bird", "小鸟": "bird",
  "鱼": "fish", "小鱼": "fish",
  "兔子": "rabbit", "兔": "rabbit", "小兔": "rabbit",
  "蝴蝶": "butterfly",
  "树": "tree", "大树": "tree",
  "花": "flower", "花朵": "flower", "向日葵": "flower",
  "蘑菇": "mushroom",
  "太阳": "sun",
  "山": "mountain", "高山": "mountain",
  "房子": "house", "房屋": "house",
  "汽车": "car", "小车": "car", "车": "car",
  "船": "boat", "小船": "boat",
  "飞机": "airplane",
  "苹果": "apple",
  "咖啡": "coffee_cup", "咖啡杯": "coffee_cup",
  "人": "person", "人物": "person",
  "皇冠": "crown", "王冠": "crown",
  "钥匙": "key",
  "旗帜": "flag", "旗": "flag",
};

// ─── 公开 API ─────────────────────────────────────────────────

export function getComplexTemplateNames(): string[] {
  return Object.keys(COMPLEX_TEMPLATE_MAP);
}

export function resolveComplexTemplateName(name: string): ComplexTemplateName | null {
  const lower = name.toLowerCase().trim();
  if (lower in COMPLEX_TEMPLATE_MAP) return lower as ComplexTemplateName;
  if (lower in CN_COMPLEX_MAP) return CN_COMPLEX_MAP[lower];
  return null;
}

export function generateComplexTemplate(
  name: string,
  params: TemplateParams
): TemplateResult | null {
  const resolved = resolveComplexTemplateName(name);
  if (!resolved) return null;
  return COMPLEX_TEMPLATE_MAP[resolved](params);
}
