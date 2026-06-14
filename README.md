# VDC — Voice-Driven Canvas

Demo演示视频：通过网盘分享的文件：语音会话
链接: https://pan.baidu.com/s/1AC98mG_LajXTWNs-EwHfew?pwd=7mpr 提取码: 7mpr


> AI 语音绘图工具 — 说话就能画

## 📋 项目要求

开发一款**纯语音控制**的绘图工具：

- 用户**不能使用鼠标或键盘**，仅通过语音指令完成绘图创作
- 综合考虑**指令理解的准确性与容错性** —— 对语音识别错误、模糊表达、同义词等具备纠正和容错能力
- 关注**语音到绘图操作的响应延迟** —— 从用户说完到画布呈现结果的全链路延迟优化
- 具备**复杂指令的拆解与执行能力** —— 将"画一只猫坐在屋顶上"这类复合意图拆解为多个原子绘图操作并依次执行
- 额外提交一份设计文档，记录计划支持的指令能力、最终实现情况，以及未完成部分的原因说明

---

VDC 是一款 AI 驱动的纯语音绘图工具。用户仅通过自然语言语音指令，即可在画布上创建几何图形、复杂模板（动物、植物、交通工具等）、矢量图标和 AI 生成图像，所有内容以 rough.js 手绘风格渲染。

## ✨ 功能特性

- **语音绘图** — 通过浏览器原生语音识别（Web Speech API）输入指令，AI 理解意图后自动调用绘图工具
- **16 种 LLM 可调用工具** — 包括生成形状、模板、SVG 路径、AI 图像、矢量图标搜索、对齐、撤销重做等
- **40+ 参数化模板** — 覆盖动物、植物、建筑、交通工具、食物、人物等类别，支持精细参数控制
- **手绘风格渲染** — 基于 rough.js 的 sketch 美学，所有图形呈现手绘效果
- **50×50 网格坐标系统** — 支持网格坐标、空间位置和绝对像素三种定位方式
- **约束求解对齐** — 基于 kiwi.js（Cassowary 算法）的声明式空间对齐
- **AI 图像生成** — 通过 Pollinations.ai 生成白底涂鸦风格图像
- **100+ 矢量图标** — 语义搜索 Lucide 图标库，支持中英文关键词
- **撤销/重做** — 50 步快照式历史栈
- **导入/导出** — 画布状态可保存为 `.canvas` JSON 文件
- **语音纠错** — 内置中文语音识别常见错误的纠正映射

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| 画布渲染 | Konva.js 9 (react-konva) + rough.js |
| 状态管理 | 自定义 CanvasStore |
| 语音识别 | Web Speech API (ASR) |
| 语音合成 | Web Speech API (TTS) |
| LLM | mimo-v2.5-pro（小米，OpenAI 兼容 API） |
| AI 图像 | Pollinations.ai |
| 约束求解 | kiwi.js (Cassowary) |
| 包管理 | pnpm monorepo |
| 测试 | Vitest |

## 📦 项目结构

```
draw/
├── apps/
│   ├── web/                          # 前端应用 (@vdc/web)
│   │   └── src/
│   │       ├── App.tsx               # 根组件：画布 + 语音 + UI 面板
│   │       ├── hooks/useVoiceAgent.ts # 语音管线 Hook (ASR → LLM → Tools → TTS)
│   │       ├── components/           # UI 组件（语音按钮、文本输入、动画背景）
│   │       └── services/             # LLM 客户端、ASR、TTS 服务
│   └── api/                          # 后端 API（占位，暂未启用）
├── packages/
│   ├── shared/                       # @vdc/shared — 类型、常量、工具函数
│   ├── canvas-engine/                # @vdc/canvas-engine — 状态管理 + 渲染器
│   │   ├── store.ts                  # CanvasStore：CRUD、撤销重做、持久化
│   │   ├── renderer.ts               # KonvaRenderer：4 层 Konva 渲染
│   │   ├── roughRenderer.ts          # rough.js 手绘形状工厂
│   │   └── constraintSolver.ts       # kiwi.js 几何对齐求解器
│   └── voice-agent/                  # @vdc/voice-agent — 工具定义 + 服务
│       ├── tools.ts                  # 16 种 LLM 可调用画布工具
│       ├── templates.ts              # 15 种基础 SVG 模板
│       ├── complexTemplates.ts       # 40+ 参数化复杂模板
│       ├── imageService.ts           # AI 图像生成服务
│       └── iconSearch.ts             # 矢量图标语义搜索
├── package.json
└── pnpm-workspace.yaml
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 9

### 安装与运行

```bash
# 克隆项目
git clone <repo-url>
cd draw

# 安装依赖
pnpm install

# 启动开发服务器（localhost:3000）
pnpm dev
```

### 环境变量（可选）

在 `apps/web/.env` 中配置：

```env
VITE_MIMO_API_KEY=your_api_key        # 小米 mimo API 密钥（语音控制必需）
VITE_MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1  # API 地址
VITE_MIMO_MODEL=mimo-v2.5-pro         # 模型名称
```

> 💡 不配置 API 密钥时，应用仍可正常使用画布和文本输入模式。

### 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm test         # 运行测试
pnpm typecheck    # 类型检查
```

## 🎯 使用方式

1. 点击浮动麦克风按钮开始语音输入
2. 用自然语言描述你想画的内容，例如：
   - "画一个红色的圆形"
   - "在左边画一只猫"
   - "画一棵树和一栋房子"
   - "画一个箭头指向右边"
3. 也可以通过底部文本框输入文字指令
4. 支持撤销/重做、导入/导出画布状态

## 📐 架构概览

```
用户语音 → Web Speech API (ASR)
                ↓
           文本指令
                ↓
     mimo LLM (Tool Calling)
                ↓
     16 种画布工具调用
                ↓
     CanvasStore (状态更新)
                ↓
     KonvaRenderer + rough.js (渲染)
                ↓
        画布展示手绘风格图形
```

## 📄 相关文档

- [产品需求与架构文档](PRD_Architecture.md)
- [部署指南](DEPLOY.md)
- [开发进度](TODO.md)

## License

MIT
