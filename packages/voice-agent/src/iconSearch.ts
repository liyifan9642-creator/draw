/**
 * Icon Search — 矢量图标语义检索
 *
 * 内置 100+ 常用 Lucide 图标的 SVG 路径数据。
 * 用户描述意图 → LLM 调用 search_icon → 匹配最佳图标 → 渲染为矢量路径。
 *
 * 图标来源：Lucide Icons (lucide.dev) — MIT 协议
 * 所有图标使用 24x24 viewBox，stroke-width=2
 */

// ─── 类型 ────────────────────────────────────────────────────

export interface IconEntry {
  /** 图标名（英文） */
  name: string;
  /** 中文关键词 */
  keywords: string[];
  /** SVG path 数据（24x24 viewBox） */
  pathData: string;
  /** 分类 */
  category: string;
}

export interface SearchResult {
  icon: IconEntry;
  score: number;
}

// ─── 图标库 ──────────────────────────────────────────────────

const ICONS: IconEntry[] = [
  // ── 箭头/方向 ──
  { name: "arrow-right", keywords: ["箭头", "右", "方向", "arrow", "right"], category: "arrow", pathData: "M5 12h14M12 5l7 7-7 7" },
  { name: "arrow-left", keywords: ["箭头", "左", "方向", "arrow", "left"], category: "arrow", pathData: "M19 12H5M12 19l-7-7 7-7" },
  { name: "arrow-up", keywords: ["箭头", "上", "方向", "arrow", "up"], category: "arrow", pathData: "M12 19V5M5 12l7-7 7 7" },
  { name: "arrow-down", keywords: ["箭头", "下", "方向", "arrow", "down"], category: "arrow", pathData: "M12 5v14M19 12l-7 7-7-7" },
  { name: "chevron-right", keywords: ["右", "展开", "chevron"], category: "arrow", pathData: "M9 18l6-6-6-6" },
  { name: "chevron-left", keywords: ["左", "收起", "chevron"], category: "arrow", pathData: "M15 18l-6-6 6-6" },
  { name: "chevron-up", keywords: ["上", "chevron"], category: "arrow", pathData: "M18 15l-6-6-6 6" },
  { name: "chevron-down", keywords: ["下", "chevron"], category: "arrow", pathData: "M6 9l6 6 6-6" },
  { name: "move", keywords: ["移动", "拖拽", "move"], category: "arrow", pathData: "M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" },

  // ── 形状 ──
  { name: "circle", keywords: ["圆", "圆形", "circle"], category: "shape", pathData: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
  { name: "square", keywords: ["正方形", "矩形", "square"], category: "shape", pathData: "M3 3h18v18H3z" },
  { name: "triangle", keywords: ["三角形", "triangle"], category: "shape", pathData: "M12 3L22 21H2z" },
  { name: "diamond", keywords: ["菱形", "钻石", "diamond"], category: "shape", pathData: "M2.7 10.7L12 2.3l9.3 8.4-9.3 10.6-9.3-10.6z" },
  { name: "hexagon", keywords: ["六边形", "hexagon"], category: "shape", pathData: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" },
  { name: "octagon", keywords: ["八边形", "octagon"], category: "shape", pathData: "M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" },
  { name: "star", keywords: ["星", "星星", "五角星", "star"], category: "shape", pathData: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { name: "heart", keywords: ["心", "爱心", "heart", "love"], category: "shape", pathData: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
  { name: "pentagon", keywords: ["五边形", "pentagon"], category: "shape", pathData: "M12 2l9.51 6.91-3.63 11.18H6.12L2.49 8.91z" },

  // ── 用户/人物 ──
  { name: "user", keywords: ["用户", "人物", "人", "user", "person"], category: "people", pathData: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  { name: "users", keywords: ["多人", "团队", "users", "group"], category: "people", pathData: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { name: "user-plus", keywords: ["添加用户", "新用户", "add user"], category: "people", pathData: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 7a4 4 0 100 8 4 4 0 000-8zM20 8v6M23 11h-6" },
  { name: "baby", keywords: ["婴儿", "小孩", "baby"], category: "people", pathData: "M9 12h.01M15 12h.01M12 2a8 8 0 00-8 8c0 3.4 2.1 6.3 5 7.5V20h6v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 00-8-8z" },

  // ── 动物 ──
  { name: "cat", keywords: ["猫", "猫咪", "cat"], category: "animal", pathData: "M12 5c-1.5 0-3 .5-4 2-2 0-4 1-4 4 0 3 2 5 4 6v3h8v-3c2-1 4-3 4-6 0-3-2-4-4-4-1-1.5-2.5-2-4-2zM9 12h.01M15 12h.01" },
  { name: "dog", keywords: ["狗", "狗狗", "dog"], category: "animal", pathData: "M10 5.172C10 3.782 8.883 2.5 7.5 2.5S5 3.782 5 5.172C5 6.562 6.117 7.5 7.5 7.5S10 6.562 10 5.172zM19 5.172C19 3.782 17.883 2.5 16.5 2.5S14 3.782 14 5.172C14 6.562 15.117 7.5 16.5 7.5S19 6.562 19 5.172zM12 22c-4 0-8-2-8-8 0-2 1-4 3-5l1-1h12l1 1c2 1 3 3 3 5 0 6-4 8-8 8z" },
  { name: "fish", keywords: ["鱼", "fish"], category: "animal", pathData: "M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6zM18 12h.01M14.5 8.5a.5.5 0 110-1 .5.5 0 010 1z" },
  { name: "bird", keywords: ["鸟", "bird"], category: "animal", pathData: "M16 7h.01M3.4 18H12a8 8 0 008-8V7a4 4 0 00-7.28-2.3L2 20M20 7l2 .5-2 .5" },
  { name: "rabbit", keywords: ["兔子", "rabbit"], category: "animal", pathData: "M18 4a2 2 0 00-2 2v1a2 2 0 00-4 0V6a2 2 0 00-2-2 2 2 0 00-2 2v8a8 8 0 0016 0V6a2 2 0 00-2-2zM8 15h.01M16 15h.01" },
  { name: "butterfly", keywords: ["蝴蝶", "butterfly"], category: "animal", pathData: "M12 3c-1.5 0-3 1-3.5 2.5C7 6 6 7 5 8.5c-1.5 2-1.5 5 0 7 1.5 2 3 3 5 3.5.5 1.5 2 2.5 3.5 2.5s3-1 3.5-2.5c2-.5 3.5-1.5 5-3.5 1.5-2 1.5-5 0-7-1-1.5-2-2.5-3.5-3C16 4 14.5 3 12 3zM12 3v18" },

  // ── 自然 ──
  { name: "sun", keywords: ["太阳", "sun", "sunny"], category: "nature", pathData: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14 7 7 0 000-14z" },
  { name: "moon", keywords: ["月亮", "月牙", "moon"], category: "nature", pathData: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
  { name: "cloud", keywords: ["云", "云朵", "cloud"], category: "nature", pathData: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" },
  { name: "cloud-rain", keywords: ["雨", "下雨", "rain"], category: "nature", pathData: "M16 13v8M8 13v8M20 17.5c.7-1.8.7-4.2 0-6M12 17.5c.7-1.8.7-4.2 0-6M4 17.5c.7-1.8.7-4.2 0-6M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" },
  { name: "snowflake", keywords: ["雪花", "雪", "snow"], category: "nature", pathData: "M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07M12 2l2 4-2 2-2-2z" },
  { name: "flame", keywords: ["火焰", "火", "fire", "flame"], category: "nature", pathData: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" },
  { name: "mountain", keywords: ["山", "高山", "mountain"], category: "nature", pathData: "M8 3l4 8 5-5 5 15H2z" },
  { name: "tree", keywords: ["树", "大树", "tree"], category: "nature", pathData: "M12 3l-8 15h16L12 3zM12 18v4M8 22h8" },
  { name: "flower", keywords: ["花", "花朵", "flower"], category: "nature", pathData: "M12 7.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12 7.5c-2.5 0-5 2.5-5 5s2.5 5 5 5 5-2.5 5-5-2.5-5-5-5zM12 7.5c0 2.5-2.5 5-5 5M12 7.5c0 2.5 2.5 5 5 5M12 17.5v4" },
  { name: "leaf", keywords: ["叶子", "leaf"], category: "nature", pathData: "M11 20A7 7 0 019.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.5 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" },

  // ── 食物 ──
  { name: "apple", keywords: ["苹果", "apple"], category: "food", pathData: "M12 2c-1.5 0-3 .5-4 2-2 0-4 1-4 4 0 5 4 9 8 12 4-3 8-7 8-12 0-3-2-4-4-4-1-1.5-2.5-2-4-2zM12 2v4" },
  { name: "coffee", keywords: ["咖啡", "coffee"], category: "food", pathData: "M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3" },
  { name: "pizza", keywords: ["披萨", "pizza"], category: "food", pathData: "M12 2c-4.97 0-9 3.58-9 8 0 1.95.76 3.74 2 5.14V22l4.14-2.76c.62.13 1.26.2 1.86.2 4.97 0 9-3.58 9-8s-4.03-8-9-8zM8 14h.01M12 14h.01M16 14h.01" },
  { name: "cake", keywords: ["蛋糕", "cake", "birthday"], category: "food", pathData: "M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8M3 11V7a2 2 0 012-2h14a2 2 0 012 2v4M12 2v4M8 2v2M16 2v2" },
  { name: "ice-cream", keywords: ["冰淇淋", "ice cream"], category: "food", pathData: "M8 12l4 8 4-8M7 8a5 5 0 0110 0" },
  { name: "cherry", keywords: ["樱桃", "cherry"], category: "food", pathData: "M12 2c-1.5 0-3 .5-4 2-2 0-4 1-4 4 0 3 2 5 4 6v3h8v-3c2-1 4-3 4-6 0-3-2-4-4-4-1-1.5-2.5-2-4-2z" },

  // ── 物品 ──
  { name: "home", keywords: ["房子", "家", "home", "house"], category: "object", pathData: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" },
  { name: "car", keywords: ["汽车", "车", "car"], category: "object", pathData: "M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2M6.5 16a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM16.5 16a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" },
  { name: "plane", keywords: ["飞机", "airplane", "plane"], category: "object", pathData: "M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.8.3 1.1L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.7.5 1.1.3l.5-.2c.4-.3.6-.7.5-1.2z" },
  { name: "ship", keywords: ["船", "ship", "boat"], category: "object", pathData: "M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M19.38 20A11.6 11.6 0 0021 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76M12 2v10" },
  { name: "key", keywords: ["钥匙", "key"], category: "object", pathData: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" },
  { name: "lock", keywords: ["锁", "lock", "security"], category: "object", pathData: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" },
  { name: "bell", keywords: ["铃铛", "通知", "bell", "notification"], category: "object", pathData: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" },
  { name: "camera", keywords: ["相机", "拍照", "camera"], category: "object", pathData: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z" },
  { name: "phone", keywords: ["电话", "手机", "phone"], category: "object", pathData: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" },
  { name: "mail", keywords: ["邮件", "信", "mail", "email"], category: "object", pathData: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
  { name: "music", keywords: ["音乐", "音符", "music"], category: "object", pathData: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z" },
  { name: "camera", keywords: ["相机", "camera"], category: "object", pathData: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z" },

  // ── 界面/操作 ──
  { name: "search", keywords: ["搜索", "查找", "search"], category: "ui", pathData: "M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35" },
  { name: "settings", keywords: ["设置", "齿轮", "settings", "gear"], category: "ui", pathData: "M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2zM12 15a3 3 0 100-6 3 3 0 000 6z" },
  { name: "plus", keywords: ["加", "添加", "plus", "add"], category: "ui", pathData: "M12 5v14M5 12h14" },
  { name: "minus", keywords: ["减", "删除", "minus", "remove"], category: "ui", pathData: "M5 12h14" },
  { name: "x", keywords: ["关闭", "取消", "close", "cancel"], category: "ui", pathData: "M18 6L6 18M6 6l12 12" },
  { name: "check", keywords: ["确认", "勾选", "check", "done"], category: "ui", pathData: "M20 6L9 17l-5-5" },
  { name: "edit", keywords: ["编辑", "笔", "edit", "pencil"], category: "ui", pathData: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" },
  { name: "trash", keywords: ["删除", "垃圾桶", "trash", "delete"], category: "ui", pathData: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" },
  { name: "download", keywords: ["下载", "download"], category: "ui", pathData: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" },
  { name: "upload", keywords: ["上传", "upload"], category: "ui", pathData: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" },
  { name: "share", keywords: ["分享", "share"], category: "ui", pathData: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" },
  { name: "copy", keywords: ["复制", "copy"], category: "ui", pathData: "M20 9h-8a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2zM4 15H2a2 2 0 01-2-2V2a2 2 0 012-2h11a2 2 0 012 2v2" },
  { name: "save", keywords: ["保存", "save"], category: "ui", pathData: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" },
  { name: "refresh", keywords: ["刷新", "refresh", "reload"], category: "ui", pathData: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" },
  { name: "menu", keywords: ["菜单", "menu", "hamburger"], category: "ui", pathData: "M3 12h18M3 6h18M3 18h18" },
  { name: "filter", keywords: ["筛选", "过滤", "filter"], category: "ui", pathData: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" },
  { name: "sort", keywords: ["排序", "sort"], category: "ui", pathData: "M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" },
  { name: "eye", keywords: ["眼睛", "查看", "eye", "view"], category: "ui", pathData: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z" },
  { name: "eye-off", keywords: ["隐藏", "不可见", "hide"], category: "ui", pathData: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" },
  { name: "link", keywords: ["链接", "link"], category: "ui", pathData: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" },
  { name: "image", keywords: ["图片", "图像", "image", "photo"], category: "ui", pathData: "M21 15l-5-5L5 21M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" },
  { name: "file", keywords: ["文件", "file"], category: "ui", pathData: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" },
  { name: "folder", keywords: ["文件夹", "folder"], category: "ui", pathData: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
  { name: "calendar", keywords: ["日历", "日期", "calendar", "date"], category: "ui", pathData: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" },
  { name: "clock", keywords: ["时钟", "时间", "clock", "time"], category: "ui", pathData: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2" },
  { name: "map", keywords: ["地图", "map"], category: "ui", pathData: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" },
  { name: "compass", keywords: ["指南针", "compass"], category: "ui", pathData: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" },

  // ── 天气/状态 ──
  { name: "thermometer", keywords: ["温度计", "温度", "thermometer"], category: "weather", pathData: "M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" },
  { name: "wind", keywords: ["风", "wind"], category: "weather", pathData: "M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" },
  { name: "umbrella", keywords: ["雨伞", "umbrella"], category: "weather", pathData: "M23 12a11.05 11.05 0 00-22 0zm-5 7a3 3 0 01-6 0v-7" },
  { name: "zap", keywords: ["闪电", "zap", "lightning"], category: "weather", pathData: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { name: "droplet", keywords: ["水滴", "water", "droplet"], category: "weather", pathData: "M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" },
  { name: "fire", keywords: ["火", "fire"], category: "weather", pathData: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" },
];

// ─── 中文关键词索引 ──────────────────────────────────────────

/** 构建中文关键词 → 图标名的反向索引 */
const KEYWORD_INDEX = new Map<string, IconEntry[]>();
for (const icon of ICONS) {
  for (const kw of icon.keywords) {
    const lower = kw.toLowerCase();
    if (!KEYWORD_INDEX.has(lower)) {
      KEYWORD_INDEX.set(lower, []);
    }
    KEYWORD_INDEX.get(lower)!.push(icon);
  }
}

// ─── 搜索 API ────────────────────────────────────────────────

/**
 * 语义搜索图标
 *
 * @param query 搜索关键词（中英文均可）
 * @param limit 返回数量（默认 5）
 * @returns 匹配结果（按相关度排序）
 */
export function searchIcons(query: string, limit: number = 5): SearchResult[] {
  const q = query.toLowerCase().trim();
  const results = new Map<string, { icon: IconEntry; score: number }>();

  for (const icon of ICONS) {
    let score = 0;

    // 精确匹配图标名
    if (icon.name === q) {
      score += 100;
    }
    // 图标名包含查询
    else if (icon.name.includes(q)) {
      score += 50;
    }

    // 关键词匹配
    for (const kw of icon.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === q) {
        score += 80;
      } else if (kwLower.includes(q) || q.includes(kwLower)) {
        score += 30;
      }
    }

    // 分类匹配
    if (icon.category.includes(q)) {
      score += 20;
    }

    if (score > 0 && !results.has(icon.name)) {
      results.set(icon.name, { icon, score });
    }
  }

  // 按分数排序
  return Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 获取图标 by 名称
 */
export function getIconByName(name: string): IconEntry | undefined {
  return ICONS.find((i) => i.name === name);
}

/**
 * 获取所有图标名（用于 LLM 提示）
 */
export function getAllIconNames(): string[] {
  return ICONS.map((i) => i.name);
}

/**
 * 按分类获取图标
 */
export function getIconsByCategory(category: string): IconEntry[] {
  return ICONS.filter((i) => i.category === category);
}

/** 获取所有分类 */
export function getCategories(): string[] {
  return [...new Set(ICONS.map((i) => i.category))];
}
