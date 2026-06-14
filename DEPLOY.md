# VDC (Voice-Driven Canvas) — 部署指南

> AI 语音绘图工具 — "说话就能画"

---

## 项目概述

VDC 是一个基于语音和文本指令的 AI 绘图工具，支持：
- 🎨 几何图形生成（矩形、圆形、三角形、椭圆、线条）
- 🖼️ AI 图像生成（异步加载，支持多种风格）
- 🗣️ 语音控制（ElevenLabs Conversational AI）
- ↩️ 撤销/重做（50 步历史栈）
- 💾 自动保存（localStorage）
- 📥📤 导入/导出（.canvas 文件）

---

## 环境变量

在 Vercel 或 `.env` 文件中配置以下环境变量：

| 变量名 | 必需 | 说明 | 获取方式 |
|--------|------|------|----------|
| `VITE_ELEVENLABS_AGENT_ID` | 否 | ElevenLabs 语音 Agent ID，用于语音控制功能 | [elevenlabs.io/app/conversational-ai](https://elevenlabs.io/app/conversational-ai) |
| `VITE_FAL_API_KEY` | 否 | Fal.ai API Key，用于真实 AI 图像生成（当前使用占位 API） | [fal.ai](https://fal.ai) |
| `VITE_OPENAI_API_KEY` | 否 | OpenAI API Key，备选图像生成方案 | [platform.openai.com](https://platform.openai.com) |

**注意**：不配置任何环境变量时，应用仍可正常使用文本指令模式。

---

## 本地开发

### 前置条件

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm --filter @vdc/web dev
```

访问 `http://localhost:3000`（或终端显示的端口）。

### 配置环境变量

1. 复制 `apps/web/.env.example` 为 `apps/web/.env`
2. 填入你的 API Key
3. 重启开发服务器

---

## 生产构建

```bash
pnpm --filter @vdc/web build
```

构建产物位于 `apps/web/dist/` 目录。

### 本地预览构建产物

```bash
pnpm --filter @vdc/web preview
```

---

## Vercel 部署

### 方式一：连接 Git 仓库（推荐）

1. 登录 [vercel.com](https://vercel.com)
2. 点击 **New Project**
3. 导入你的 Git 仓库
4. 配置以下设置：
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
5. 在 **Environment Variables** 中添加：
   - `VITE_ELEVENLABS_AGENT_ID` = 你的 Agent ID
6. 点击 **Deploy**

### 方式二：Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd apps/web
vercel

# 设置环境变量
vercel env add VITE_ELEVENLABS_AGENT_ID
```

### Monorepo 配置

如果 Vercel 无法自动识别 monorepo 结构，在项目根目录创建 `vercel.json`：

```json
{
  "buildCommand": "pnpm --filter @vdc/web build",
  "outputDirectory": "apps/web/dist",
  "installCommand": "pnpm install"
}
```

---

## 技术栈

- **前端框架**: React 18 + TypeScript
- **画布渲染**: Konva.js 9 (react-konva)
- **构建工具**: Vite 5
- **包管理**: pnpm monorepo
- **语音 AI**: ElevenLabs Conversational AI SDK
- **图像生成**: picsum.photos (占位) / Fal.ai / DALL·E (可选)

---

## 项目结构

```
d:\Project\draw
├── apps/web/                    # 主前端应用 (@vdc/web)
│   ├── src/
│   │   ├── App.tsx              # 主应用组件
│   │   ├── hooks/
│   │   │   └── useVoiceAgent.ts # 语音 Agent Hook
│   │   └── components/
│   │       ├── TextInput.tsx    # 文本指令输入
│   │       └── VoiceButton.tsx  # 语音控制按钮
│   └── .env.example             # 环境变量模板
├── packages/
│   ├── shared/                  # 共享类型 + 常量
│   ├── canvas-engine/           # 画布引擎 (Store + Renderer)
│   └── voice-agent/             # 语音 Agent + 工具定义
├── PRD_Architecture.md          # 完整 PRD
├── DEPLOY.md                    # 本文件
└── package.json                 # 根配置
```

---

## 常见问题

### Q: 语音功能不工作？

A: 确保已配置 `VITE_ELEVENLABS_AGENT_ID`，并已在 ElevenLabs 平台创建了 Agent。

### Q: 图片生成返回随机图片？

A: 当前使用 picsum.photos 作为占位 API。如需真实 AI 图像，需配置 `VITE_FAL_API_KEY` 或 `VITE_OPENAI_API_KEY`。

### Q: 刷新后画布数据丢失？

A: 数据存储在浏览器 localStorage 中。清除浏览器数据会导致丢失。建议定期使用 Export 功能备份。

### Q: 构建时出现 TypeScript 错误？

A: 运行 `pnpm --filter @vdc/web build`（Vite build）而非 `tsc --noEmit`。Vite 使用 esbuild 转译，不依赖 tsc 项目引用。

---

## License

Private — 仅供个人使用
