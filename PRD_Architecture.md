# AI 语音绘图工具（Voice-Driven Canvas）— PRD & Architecture Design Document

> **版本**：2.0 | **日期**：2026-06-13 | **状态**：Draft

---

## Table of Contents

- [Part 1：产品定义](#part-1产品定义)
  - [1.1 业务背景与目标](#11-业务背景与目标)
  - [1.2 用户故事与交互流程](#12-用户故事与交互流程)
  - [1.3 非功能性需求](#13-非功能性需求)
- [Part 2：系统架构](#part-2系统架构)
  - [2.1 系统架构拓扑图](#21-系统架构拓扑图)
  - [2.2 前端状态管理方案](#22-前端状态管理方案)
  - [2.3 LLM 系统提示词](#23-llm-系统提示词)
- [Part 3：工具与接口定义](#part-3工具与接口定义)
  - [3.1 工具设计原则](#31-工具设计原则)
  - [3.2 核心工具 JSON Schema](#32-核心工具-json-schema)
  - [3.3 工具返回值规范](#33-工具返回值规范)
  - [3.4 多轮工具调用](#34-多轮工具调用multi-round-tool-calling)
- [Part 4：异常处理与边界场景](#part-4异常处理与边界场景)
  - [4.1 语音转录容错](#41-语音转录容错)
  - [4.2 LLM 的"盲区推理"](#42-llm-的盲区推理缺乏原生二维空间视觉)
  - [4.3 异步长耗时任务的并发与打断处理](#43-异步长耗时任务的并发与打断处理)
  - [4.4 完整的失败模式矩阵](#44-完整的失败模式矩阵failure-mode-matrix)
  - [4.5 数据持久化与恢复](#45-数据持久化与恢复)
- [Part 5：附录](#part-5附录)

---

# Part 1：产品定义

---

## 1.1 业务背景与目标

### 项目背景

传统绘图工具依赖鼠标键盘精细操作，学习曲线陡峭，且在移动端、演示场景下交互效率低。随着 Whisper、GPT-4o 等多模态大模型成熟，语音作为最自然的输入模态，有望大幅降低图形创作门槛。Voice-Driven Canvas（以下简称 VDC）旨在构建一个"说话就能画"的 AI 驱动画布，将语音指令实时转化为几何图形、文本排版和图像元素，让非专业用户也能在数秒内完成可视化表达。

**核心价值主张**：让不会使用专业绘图软件的人，通过说话就能完成视觉表达。

### 目标用户画像

| 用户类型 | 典型使用场景 | 核心痛点 | 技术素养 |
|---|---|---|---|
| **产品经理 / 项目管理** | 会议中快速绘制流程图、架构图、用户旅程图；向利益相关者演示方案 | 不擅长 Figma/Sketch，手绘草图不够正式；会后补图耗时 | 中等，熟悉在线协作工具，但无设计软件经验 |
| **教师 / 培训讲师** | 课堂实时生成示意图、数学几何图形、思维导图；板书数字化 | 白板内容无法保存复用；PPT 图形修改不灵活 | 中低，对语音交互接受度高，期望即说即现 |
| **独立创作者 / 自媒体** | 社交媒体配图、概念可视化、头脑风暴视觉记录 | 专业设计工具成本高、出图慢；灵感稍纵即逝 | 中高，愿意尝试 AI 工具，对生成质量有审美要求 |
| **无障碍用户（视障/肢体障碍）** | 纯语音完成图形编辑与文档排版 | 现有工具严重依赖鼠标拖拽，无障碍支持差 | 因人而异，但语音操作意愿极强 |

### 核心使用场景

1. **会议速记可视化**：产品经理在远程会议中说"画一个从左到右的流程图，三个节点分别是需求、开发、上线"，系统实时生成可编辑的流程图，支持后续语音调整样式和连线。
2. **课堂互动绘图**：教师说"画一个直角三角形，标注两直角边分别为 3 和 4"，系统生成图形并自动标注数值，学生可实时看到推导过程。
3. **创意快速原型**：创作者说"在画布中央放一张猫咪的图片，背景改成浅蓝色，右侧加一行标题'我的作品集'"，系统联动图生图模型与文字排版一次完成。

### 竞品简析

| 竞品 | 优势 | 不足 | VDC 差异点 |
|---|---|---|---|
| **FigJam（Figma）** | 协作能力强，生态成熟 | 无语音输入；移动端体验弱；学习门槛中等 | 语音优先交互，零学习成本 |
| **Miro AI** | 模板丰富，AI 辅助排版 | AI 功能限于智能布局，不支持语音驱动图形生成 | 端到端语音到图形，含图生图联动 |
| **Google Jamboard** | 轻量易用，集成 Workspace | 功能极简，AI 能力弱，无高级图形生成 | 语义理解 + 几何生成 + 文本排版一体化 |

### 成功指标 KPI

| 指标 | 目标值 | 衡量周期 |
|---|---|---|
| 语音指令到图形渲染的端到端延迟 P95 | ≤ 1.5 秒 | 持续监测 |
| 用户首次会话完成至少 1 个完整图形的比率 | ≥ 70% | 上线后 30 天 |
| 周活跃用户（WAU）留存率（次周） | ≥ 40% | 上线后 90 天 |
| 语音指令意图识别准确率 | ≥ 92% | 持续监测，每月评估 |
| NPS（净推荐值） | ≥ 35 | 上线后 60 天首轮调研 |

---

## 1.2 用户故事与交互流程

### US-1：画布级属性控制

**故事**：作为用户，我希望通过语音修改画布背景颜色、尺寸和网格显示，以便快速调整整体视觉环境。

**正常流程**：用户说"把背景改成浅灰色"→ 系统解析指令 → 提取属性 `background-color: #F0F0F0` → 画布即时更新 → 语音播报"已将背景色设为浅灰色"。

**异常流程**：若颜色名无法识别，系统追问"没有找到该颜色，请选择：红色、蓝色、绿色，或告诉我十六进制色值"；若用户沉默超过 5 秒，提示"请再说一次，或点击取消"。

**边界条件**：画布尺寸上限 8000×8000px；网格密度支持 10/20/50px 三档；"重置画布"触发二次确认。

**话术模板**：`确认态："已将{属性}设为{值}。"` / `追问态："没有听清，请再说一次。"` / `警告态："此操作将清空画布，确认请说'确定'。"`

---

### US-2：几何图形生成与编辑

**故事**：作为用户，我希望用语音创建矩形、圆形、箭头等基础图形，并修改其位置、大小和样式。

**正常流程**：用户说"画一个蓝色圆形，放在画布中央"→ NLU 解析出 shape=circle, color=blue, position=center → Konva.js 渲染 → 反馈"已创建蓝色圆形"。后续说"把它放大两倍"→ 应用 scale(2,2) → 反馈"已放大"。

**异常流程**：无法解析图形类型时，列出支持列表"目前支持矩形、圆形、三角形、箭头、线条，请选择"。尺寸超出画布时自动缩放并提示"图形已调整为画布可容纳的最大尺寸"。

**边界条件**：单画布图形上限 1000 个；坐标精度为整数像素；旋转角度 0-360 度；最小尺寸 10×10px。

**话术模板**：`生成态："已创建{颜色}{形状}，位于{位置}。"` / `编辑态："已将{形状}{调整为/移动到}{目标值}。"`

---

### US-3：文本生成与排版

**故事**：作为用户，我希望通过语音在画布上添加、编辑文字，并控制字体大小、对齐方式和颜色。

**正常流程**：用户说"在顶部添加标题'项目规划'，字号 36，黑色加粗"→ 创建 Text 节点，属性 font-size:36, fontWeight:bold, fill:#000, align:center → 反馈"已添加标题"。后续说"把标题改成红色"→ 更新 fill 属性 → 反馈"已将标题颜色改为红色"。

**异常流程**：文字内容过长（超过画布宽度 90%）时自动换行并提示"文字已自动换行，如需调整请告诉我"。不支持的字体回退到系统默认字体并提示。

**边界条件**：字号范围 12-200px；支持左对齐/居中/右对齐；单文本节点最大字符数 2000；支持中英文混排。

**话术模板**：`创建态："已添加文本'{内容}'，字号{size}。"` / `警告态："文字较长，已自动换行。"`

---

### US-4：多模态图生图联动

**故事**：作为用户，我希望上传一张图片或通过语音描述生成图片，并将其作为画布元素与其他图形混合排版。

**正常流程**：用户说"生成一张日落海滩的插画，放在右侧"→ 调用图生图 API → 生成图片 → 作为 Image 节点插入画布右侧 → 反馈"已生成图片并放置在右侧"。或用户上传图片后说"裁剪成正方形"→ 应用 clipFunc → 反馈"已裁剪为正方形"。

**异常流程**：图片生成超时（>15 秒）时提示"图片生成时间较长，请稍候或尝试更简短的描述"。内容安全策略拦截时提示"该描述无法生成图片，请调整描述内容"。

**边界条件**：单画布图片上限 20 张；单张图片最大 5MB；生成图片分辨率固定为 1024×1024；支持 JPG/PNG/WebP 格式上传。

**话术模板**：`生成态："已生成图片，正在加载到画布。"` / `异常态："图片生成失败，请重试或调整描述。"`

---

### US-5：语音撤销与重做（Undo/Redo）

**故事**：作为用户，我希望通过语音指令撤销或重做操作，且系统提供清晰的状态反馈，让我对编辑历史有完全的掌控感。

#### 核心机制

**History Stack 设计**：系统维护一个最大深度为 **50 步** 的操作历史栈（History Stack）。每次用户操作（图形创建、属性修改、删除、移动等）在执行后自动入栈。当栈满时，最早的操作记录被移除（FIFO 策略）。栈的状态通过 `undoStack: Operation[]` 和 `redoStack: Operation[]` 两个数组管理。

**正常流程 — 撤销**：用户说"撤销"→ 系统从 undoStack 弹出最近一条操作 → 执行逆操作（如创建则删除，移动则恢复原坐标）→ 将该操作压入 redoStack → 反馈"已撤销{操作描述}，还可再撤销 {N} 步"。

**正常流程 — 重做**：用户说"重做"→ 系统从 redoStack 弹出 → 正向执行 → 压回 undoStack → 反馈"已重做{操作描述}"。

**正常流程 — 连续撤销**：用户说"撤销三步"→ 依次弹出并逆执行 3 条操作 → 反馈"已撤销最近 3 步操作：{逐条描述}"。系统支持"撤销到{操作描述}"的语义定位，如"撤销到删除矩形之前"。

**撤销后重做的状态覆盖规则**：当用户在撤销后执行了任何新操作（非 redo），redoStack 被**立即清空**，不可恢复。反馈话术："已执行新操作，之前的重做记录已清除。"

#### 语音指令粒度

| 指令 | 粒度 | 说明 |
|---|---|---|
| "撤销" | 单步 | 撤销最近一次操作 |
| "撤销三步" / "撤销 N 步" | 多步 | N 最大为 min(当前栈深度, 50) |
| "撤销到{描述}" | 语义定位 | 遍历栈找到匹配项，批量撤销 |
| "重做" | 单步 | 重做最近撤销的操作 |
| "重做全部" | 全部 | 依次重做 redoStack 中所有操作 |
| "查看历史" | 查询 | 语音播报最近 5 条操作摘要 |

#### 不可撤销操作及确认机制

以下操作被定义为**不可撤销操作**，执行前必须经过二次语音确认：

1. **clear_canvas（清空画布）**：用户说"清空画布"→ 系统回应"此操作将删除所有元素且不可撤销，确认请说'确定清空'，取消请说'取消'"→ 用户说"确定清空"→ 执行清空 → 同时清空 undoStack 和 redoStack → 反馈"画布已清空，历史记录已重置"。

2. **export_project（导出并覆盖）**：用户说"导出并覆盖保存"→ 确认机制同上 → 反馈"已导出，当前历史已归档"。

3. **reset_workspace（重置工作区）**：包含清空画布 + 重置所有设置 → 需确认 → 清空所有栈。

**确认超时处理**：确认提示发出后 10 秒无响应，自动取消操作并反馈"操作已取消，请重新发起"。

**异常流程**：
- 撤销栈为空时说"撤销"→ 反馈"没有可撤销的操作"。
- 重做栈为空时说"重做"→ 反馈"没有可重做的操作"。
- 指定步数超过栈深度时→ 反馈"当前最多可撤销 {N} 步，已为您撤销全部 {N} 步"。

**边界条件**：History Stack 每条操作记录包含 `{ timestamp, type, nodeId, beforeState, afterState }`，单条记录序列化后最大 50KB；超过时 beforeState/afterState 仅存储 diff 而非完整快照；页面刷新后从 IndexedDB 恢复栈状态。

**话术模板**：
- 撤销确认态："已撤销{操作}，剩余可撤销 {N} 步。"
- 重做确认态："已重做{操作}。"
- 栈空提示态："没有更多可{撤销/重做}的操作了。"
- 确认态："此操作不可撤销，请确认：'{确认话术}'。"
- 覆盖警告态："执行了新操作，重做记录已清除。"

---

### US-6：多节点空间关系操作

**故事**：作为用户，我希望通过语音调整多个图形之间的空间关系，如对齐、分布、层级和分组。

**正常流程**：用户说"选中这三个矩形，水平居中对齐"→ 系统选中目标节点 → 计算中位 X 坐标 → 批量更新 → 反馈"已将 3 个矩形水平居中对齐"。用户说"把圆形放到最上层"→ 设置 zIndex → 反馈"圆形已在最上层"。

**异常流程**：选中目标不明确时（如"选中那个矩形"但存在多个）→ 反馈"找到多个矩形，请描述位置或颜色，如'左边的红色矩形'"。对齐目标少于 2 个时→ 反馈"至少需要选中 2 个元素才能对齐"。

**边界条件**：单次最多选中 20 个节点；分组后组内操作同步执行，但支持"取消分组"；层叠上限与图形数量上限一致（1000）。

**话术模板**：`操作态："已将{N}个元素{对齐方式}。"` / `追问态："找到多个匹配项，请更具体描述。"`

---

### US-7：首次使用引导流程（Onboarding）

**故事**：作为新用户，我希望在首次打开 VDC 时获得清晰的语音引导，快速了解核心功能并完成第一个图形创作。

**正常流程**：
1. 打开页面 → 播放欢迎语音"欢迎使用语音绘图工具。你可以用说话的方式创建图形、添加文字。我们来试试吧。"
2. 引导步骤一："请试着说'画一个红色矩形'"→ 用户说出 → 系统生成 → "太棒了！红色矩形已创建。"
3. 引导步骤二："现在试试说'在旁边加一个蓝色圆形'"→ 用户说出 → 生成 → "很好，你已经会创建图形了。"
4. 引导步骤三："试试说'撤销'"→ 用户说出 → 矩形被撤销 → "撤销成功。说'重做'可以恢复。"
5. 引导结束："你已掌握基础操作。点击左上角帮助图标随时查看语音指令列表。"

**异常流程**：若用户在任一步骤沉默超过 15 秒 → 提供文字提示卡片 + "可以点击跳过引导"选项。若语音识别失败 → "没有听清，请再说一次，或点击下方按钮手动操作"。

**边界条件**：Onboarding 仅首次访问触发；localStorage 存储 `onboarding_completed: true` 标记；支持"跳过引导"；引导过程中禁用 clear_canvas 等危险操作。

**话术模板**：`引导态："请试着说'{示例指令}'。"` / `鼓励态："太棒了！{功能}已生效。"` / `跳过态："好的，跳过引导。随时点击帮助查看使用说明。"`

---

## 1.3 非功能性需求

### 性能

| 指标 | 目标 | 说明 |
|---|---|---|
| 语音端到端延迟（P95） | ≤ 1500ms | 从用户说完到图形渲染完成，含 ASR + NLU + 渲染 |
| 语音端到端延迟（P50） | ≤ 800ms | 正常网络条件下的中位体验 |
| Konva 帧率（N=10 节点） | ≥ 60fps | 基础场景流畅无卡顿 |
| Konva 帧率（N=100 节点） | ≥ 45fps | 中等复杂度仍可接受 |
| Konva 帧率（N=1000 节点） | ≥ 30fps | 极端场景，启用虚拟渲染优化 |
| JSON 序列化耗时（100 节点） | ≤ 50ms | 用于持久化和撤销栈序列化 |
| JSON 序列化耗时（1000 节点） | ≤ 300ms | 超过时采用增量序列化策略 |

### 并发

- 单画布支持最多 **5 人实时协作**（基于 CRDT 或 OT 算法）。
- 语音输入同一时刻仅允许 **1 人**发言（通过麦克风锁定机制），其他人自动切换为观察模式。
- 协作场景下撤销/重做仅影响**本地操作历史**，不撤销他人操作。

### 安全

- **语音隐私**：语音数据端到端加密传输（WSS + TLS 1.3）；ASR 处理完成后原始音频 **不落盘**，仅保留文本转录；提供隐私设置页，用户可随时删除转录记录。
- **API Key 保护**：所有第三方 AI 服务调用通过后端代理，前端不暴露 Key；Key 存储于服务端环境变量，定期轮换（≤ 90 天）。
- **数据合规**：遵守 GDPR 和《个人信息保护法》；用户画布数据存储于用户所在区域数据中心；提供数据导出和账号删除功能；未成年人使用需监护人同意。

### 兼容性

- **浏览器**：Chrome ≥ 110、Firefox ≥ 115、Edge ≥ 110、Safari ≥ 17。Safari 需特别处理 Web Audio API 的自动播放限制（需用户手势触发 `AudioContext.resume()`）。
- **移动端**：iOS Safari 和 Android Chrome 均需适配，语音输入降级为设备原生 SpeechRecognition API；画布支持双指缩放和拖拽平移。
- **Safari Web Audio 限制**：首次播放语音反馈前必须有用户点击/触摸事件；引导流程第一步设计为"点击开始"按钮以获取 `AudioContext` 权限。

### 可访问性（降级交互方案）

- 语音不可用时（麦克风被拒绝/浏览器不支持/网络断开），自动切换为**文本输入模式**：提供指令输入框，支持与语音相同的自然语言指令。
- 键盘快捷键兜底：Ctrl+Z 撤销、Ctrl+Y 重做、Delete 删除选中元素、Tab 切换选中元素。
- 屏幕阅读器兼容：所有图形节点提供 ARIA label（由语音描述自动生成，如"蓝色矩形，位于画布中央"）。

### 数据持久化

- **本地存储**：采用 localStorage（≤ 5MB，存储用户设置和 Onboarding 状态）+ IndexedDB（≤ 50MB，存储画布快照和 History Stack）。每次操作节流自动保存（debounce 3 秒）。
- **云端同步**：已登录用户画布数据每 30 秒增量同步至云端；支持版本历史回溯（最近 30 天，每天一个快照）；离线编辑在恢复网络后自动合并，冲突时提示用户选择版本。

### 响应式设计

- **断点策略**：Desktop（≥ 1024px）完整功能布局；Tablet（768-1023px）工具栏折叠为侧边抽屉；Mobile（< 768px）底部操作栏 + 全屏画布模式。
- 画布操作面板在移动端收起为浮动按钮，点击展开；语音按钮固定于右下角，支持长按连续输入。
- 所有文字和按钮最小可点击区域 44×44px（符合 WCAG 2.1 AA 标准）。

---

# Part 2：系统架构

---

## 2.1 系统架构拓扑图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          浏览器层 (Browser Layer)                           │
│                                                                             │
│  ┌──────────┐    ┌─────────────────┐    ┌──────────────────┐                │
│  │Microphone│───→│ WebSocket Client│───→│ Action Dispatcher │                │
│  │ (WebRTC) │    │ (ElevenLabs /   │    │ (Tool Call Parser)│                │
│  └──────────┘    │  Deepgram SDK)  │    └────────┬─────────┘                │
│       ↑          └────────▲────────┘             │                          │
│       │                   │                      ▼                          │
│   音频采集          双向音频流          ┌──────────────────┐                 │
│                                        │ JSON Canvas State │                 │
│                                        │  (Zustand Store)  │                 │
│                                        └────────┬─────────┘                 │
│                                                 │ subscribe / setState       │
│  ┌──────────────────────────────────────────────┼───────────────────────┐   │
│  │              Konva.js 渲染层                   ▼                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐    │   │
│  │  │  Stage → Layer → [Rect, Circle, Line, Text, Image, Group]   │    │   │
│  │  │                    ↑ 事件委托 (click / drag / transform)      │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ WSS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    语音代理服务层 (Voice Agent Service)                      │
│                                                                             │
│  ┌────────────┐    ┌────────────┐    ┌──────────────────┐                   │
│  │    STT     │───→│    LLM     │───→│       TTS        │                   │
│  │ (Deepgram /│    │ (GPT-4o /  │    │ (ElevenLabs /    │                   │
│  │  Whisper)  │    │  Claude)   │    │  Deepgram Aura)  │                   │
│  └────────────┘    └─────┬──────┘    └──────────────────┘                   │
│                          │                                                  │
│                          ▼                                                  │
│               ┌──────────────────────┐                                      │
│               │   Tool Registry      │                                      │
│               │  (MCP / Client Tools)│                                      │
│               │                      │                                      │
│               │  - generate_shape    │                                      │
│               │  - modify_node       │                                      │
│               │  - delete_node       │                                      │
│               │  - spatial_align     │                                      │
│               │  - generate_image    │                                      │
│               │  - undo/redo_action  │                                      │
│               │  - ...               │                                      │
│               └──────────┬───────────┘                                      │
└──────────────────────────┼──────────────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      外部 API 层 (External APIs)                            │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Image Generation API                                    │   │
│  │  Stability AI (SDXL)  ─── 或 ───  DALL·E 3                          │   │
│  │  输入: prompt + size + style      输入: prompt + size + quality      │   │
│  │  输出: image URL / base64         输出: image URL                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 模块职责边界说明

- **Microphone (WebRTC Audio)**：通过浏览器 MediaRecorder API 采集 PCM/Opus 音频流，执行本地 VAD（Voice Activity Detection）以降低无效传输。职责边界：仅负责音频采集与编码，不涉及任何语义处理。

- **WebSocket Client**：维护与语音代理服务的长连接，支持二进制音频帧（上行）和 JSON 消息帧（下行）的双工传输。采用 ElevenLabs Conversational AI SDK 或 Deepgram Voice Agent API 的单 WebSocket 模型，端到端延迟目标 < 300ms。职责边界：仅负责消息收发与连接保活，不解析业务语义。

- **Action Dispatcher**：接收 WebSocket 下行 JSON 中的 `tool_calls` 字段，解析函数名与参数，映射为 Canvas State 的原子操作。职责边界：是语音层与状态层的唯一桥梁，任何状态变更必须经由此模块，禁止 STT/LLM 直接写入 Store。

- **JSON Canvas State (Zustand Store)**：全局状态树，存储画布元数据、所有节点对象、边连接关系及操作日志。所有对画布的变更必须通过 Store 的 action 方法提交，保证变更可追溯。职责边界：状态变更后通过 Zustand 的 `subscribe` 机制通知 Konva 渲染层。

- **Konva.js 渲染层**：保留模式渲染引擎，Stage 管理视口，Layer 管理渲染批次，Node 对应 Canvas State 中的每个对象。职责边界：仅负责渲染与用户直接交互（鼠标拖拽、缩放），不直接修改状态树，用户交互通过 `transformend` 等事件回调写回 Store。

- **Voice Agent Service（STT → LLM → TTS）**：STT 将音频流转录为文本，LLM 解析意图并生成 tool_calls，TTS 将结果语音化反馈用户。三者串联在同一 WebSocket 会话内，共享对话上下文。职责边界：LLM 通过 MCP 协议或 Client Tools 注册可用函数，不直接操作画布。

- **Tool Registry（MCP / Client Tools）**：向 LLM 暴露可调用的函数签名与 JSON Schema，接收 LLM 返回的 function_call 指令，转发给前端 Action Dispatcher。职责边界：是 LLM 能力的注册中心，函数签名变更只需在此处更新。

- **Image Generation API**：接收文本 prompt，返回生成的位图资源。前端将返回的 URL 写入 Canvas State 的 Image 类型节点。职责边界：仅负责图像生成，不感知画布状态。

---

## 2.2 前端状态管理方案

### 2.2.1 JSON Canvas State Machine 详细设计

状态结构遵循 JSON Canvas 规范扩展，核心数据模型如下：

```
CanvasState {
  meta: {
    version: string          // 画布版本号，每次变更自增
    viewport: { x, y, zoom } // 视口状态
    createdAt: number
    updatedAt: number
  }
  nodes: Map<string, Node>   // 所有画布对象
  edges: Map<string, Edge>   // 节点间连线
  actionLog: ActionEntry[]   // 操作日志（事务记录）
}
```

每个 Node 的结构定义：

```
Node {
  id: string                 // UUID v7（时间有序）
  type: "rect" | "circle" | "line" | "text" | "image" | "group"
  x: number                  // 左上角 X 坐标
  y: number                  // 左上角 Y 坐标
  width?: number
  height?: number
  radius?: number
  rotation: number           // 旋转角度（弧度）
  fill: string               // 填充色
  stroke: string             // 描边色
  strokeWidth: number
  opacity: number            // 0-1
  text?: string              // 仅 text 类型
  imageUrl?: string          // 仅 image 类型
  zIndex: number
  locked: boolean
  visible: boolean
  children?: string[]        // group 类型引用子节点 ID
  metadata: {
    createdAt: number
    updatedAt: number
    createdBy: "voice" | "mouse" | "system"
    label?: string           // 语义标签，用于指代消解
  }
}
```

**变更事件机制：** Zustand Store 的每个 action 执行后，自动触发以下事件流水线：

1. 执行状态更新（immutable replace）
2. 写入 actionLog（记录操作类型、变更前后的 diff 快照）
3. 推送 History Stack 快照（见 2.2.2）
4. 通过 `subscribe` 通知 Konva 层同步渲染

Zustand 与 Konva 的绑定方式：在 React 组件树中，通过 `useStore` 选择器获取 nodes 数据，渲染对应的 Konva 节点组件。对于非 React 场景（纯 Konva），通过 `store.subscribe` 监听变更，直接调用 `node.setAttrs()` 增量更新，避免全量重绘。

### 2.2.2 History Stack 架构设计

History Stack 负责 undo/redo 能力，采用快照 + diff 混合策略：

- **快照（Snapshot）**：每次状态变更时，对 `nodes` 和 `edges` 进行结构化克隆（structuredClone），存储完整状态副本。
- **差异压缩（Diff Compaction）**：当历史记录超过阈值时，将较旧的快照压缩为 diff 格式（仅记录变更的节点 ID 及其属性差异），减少内存占用。

内存约束规则：

| 约束项 | 限制值 | 说明 |
|--------|--------|------|
| 最大历史步数 | 50 步 | FIFO 策略，超出后丢弃最旧记录 |
| 单步存储上限 | 50KB | 超出时自动压缩为 diff |
| 总内存上限 | 2MB | 触发 LRU 淘汰 + diff 压缩 |

undo 实现：指针前移一步，将对应快照（或反向应用 diff）恢复到 Store。redo 实现：指针后移一步，将对应快照应用到 Store。任何新操作会清空 redo 栈。

### 2.2.3 状态管理库选型：Zustand

**选型理由：**

- **轻量无依赖**：Zustand 运行时仅约 1KB（gzip），无 Provider 包裹要求，可直接在非 React 环境（纯 Konva 应用）中使用 `store.subscribe` 监听状态。
- **中间件生态**：支持 `persist`（localStorage 持久化）、`devtools`（Redux DevTools 调试）、`immer`（immutable 更新语法糖）等中间件，无需额外配置即可接入。
- **与 Konva 集成简单**：Zustand 的选择器机制天然支持细粒度订阅，仅在目标节点数据变更时触发重绘，避免 Konva 全量 reconcile。
- **与 MCP 工具调用协同**：Action Dispatcher 可直接调用 `store.getState().createNode(payload)`，无需 dispatch wrapper，函数调用链路清晰。

对比 Jotai 的原子模型在大型画布场景下需要手动管理依赖图，而 Zustand 的单一 Store 模型更符合 Canvas State 的全局性特征。对比原生 Proxy，Zustand 提供了成熟的订阅、持久化、DevTools 集成能力，开发效率显著更高。

---

## 2.3 LLM 系统提示词（System Prompt）

以下是注入 LLM 对话上下文的完整系统提示词：

```
你是 VDC（Voice-Driven Canvas）的智能绘图助手。你的职责是理解用户的语音指令，通过调用工具函数来操作画布上的矢量对象。你绝不直接操作像素，也不猜测视觉效果——所有画布变更必须通过工具调用完成。

## 能力边界

你能够：创建、修改、删除、移动画布上的形状和文本节点；设置颜色、尺寸、透明度等视觉属性；生成 AI 图片并放置到画布；执行撤销/重做操作；导出画布为 PNG/SVG。

你不能：直接在画布上"画"像素；访问用户本地文件系统；绕过确认步骤执行危险操作；操作画布之外的 UI 元素。

## 语音转录纠错映射表

语音识别（STT）可能产生同音词错误，请按以下映射自动纠正：

### 颜色名称纠错
| STT 转录结果 | 纠正为 |
|-------------|--------|
| 赛恩 / 赛因 | cyan (#00FFFF) |
| 马真塔 / 品红 | magenta (#FF00FF) |
| 贝奇 / 贝吉 | beige (#F5F5DC) |
| 珊瑚 / 山瑚 | coral (#FF7F50) |
| 萨蒙 / 三文鱼 | salmon (#FA8072) |
| 绿松石 / 土耳其 | turquoise (#40E0D0) |
| 靛青 / 靛蓝 | indigo (#4B0082) |
| 栗色 / 深红 | maroon (#800000) |
| 藏青 / 海军蓝 | navy (#000080) |
| 橄榄 / 橄榄绿 | olive (#808000) |

### 形状名称纠错
| STT 转录结果 | 纠正为 |
|-------------|--------|
| 矩形 / 举行 / 巨型 | rect |
| 圆形 / 元形 / 原形 | circle |
| 直线 / 值线 / 支线 | line |
| 文本 / 文奔 / 问本 | text |
| 图片 / 图骗 / 涂片 | image |
| 以利普斯 / 椭圆型 | ellipse |
| 泡利贡 / 多边型 | polygon |

### CSS 属性纠错
| STT 转录结果 | 纠正为 |
|-------------|--------|
| 透明度 / 偷明度 | opacity |
| 描边 / 苗边 / 描变 | strokeWidth |
| 填充 / 甜充 / 天充 | fill |
| 旋转 / 选转 / 悬转 | rotation |
| 圆角 / 元角 / 远角 | cornerRadius |
| 弗莱克斯 / 弹性布局 | flex |
| 格瑞德 / 网格 | grid |
| Z 因戴克斯 / 层级 | z-index |
| 帕丁 / 内边距 | padding |
| 波德瑞迪厄斯 / 圆角 | border-radius |

## 指代消解规则

当用户使用代词或指示词时，按以下优先级解析引用对象：

1. **"它" "这个" "那个" "刚才那个" "刚刚那个"**：默认引用 lastModifiedNode（最近一次被创建或修改的节点）。如果上下文中最近有明确的节点名称（如"把那个矩形"），则引用该名称匹配的节点。

2. **"所有的" "全部" "所有形状"**：引用当前画布上全部可见节点。

3. **"左边那个" "上面那个" "中间那个"**：在 lastModifiedNode 的相邻节点中，按空间方位匹配最近的一个。

4. **名称匹配**："红色矩形""蓝色圆形"等，按类型 + 颜色属性组合查找，返回最佳匹配。

## 确认回环触发条件

以下操作必须在执行前向用户发出确认请求，等待用户明确同意后方可调用工具：

- **clear_canvas**：任何清空画布的请求。
- **delete_node 批量删除**：单次指令涉及删除 3 个及以上节点。
- **export_canvas 覆盖导出**：目标文件路径已存在同名文件。
- **不可逆操作**：任何无法通过 undo 恢复的外部 API 调用。

确认话术模板："你确定要 [操作描述] 吗？这将 [影响描述]。请回复'确定'继续，或'取消'放弃。"

## 指令分隔与复合意图拆解规则

当用户在单次语音输入中包含多个操作意图时：

1. **连续动词短语拆解**：包含"然后""接着""再""还有"等连接词的指令，拆解为多个独立工具调用，按语序依次执行。
   示例："创建一个红色矩形然后在右边放一个蓝色圆形" → create_node(rect, red) → create_node(circle, blue, x=rect.x + rect.width + 20)

2. **用户停顿为指令边界**：当 STT 转录结果中出现明显停顿标记（如省略号、分段），视为独立指令，逐条确认后执行。

3. **并列意图**：包含"和""以及"且操作对象明确的指令，可合并为单次工具调用的不同参数。

4. **条件意图**：包含"如果""否则"的指令，先执行条件判断，再决定调用路径。

## 空间描述解析规则

用户使用相对位置描述时，按以下规则转换为坐标：

1. **基准确立**：以 lastModifiedNode 的中心点为基准。如果没有 lastModifiedNode，以画布中心 (canvasWidth/2, canvasHeight/2) 为基准。

2. **方位映射**：
   - "左边""左侧""往左"：dx = -offsetX（默认 20px 间距）
   - "右边""右侧""往右"：dx = +offsetX
   - "上面""上方""往上"：dy = -offsetY
   - "下面""下方""往下"：dy = +offsetY
   - "旁边""附近"：dx = +（基准节点宽度 + 10px），优先右侧
   - "上方一点""稍微右边"：偏移量减半

3. **对齐描述**：
   - "对齐""对齐到左边"：x = 基准节点的 x
   - "居中""放在中间"：x = canvasWidth/2 - nodeWidth/2

4. **距离描述**：
   - "紧挨着""紧贴"：间距 = 0
   - "隔一点""留点距离"：间距 = 20px
   - "很远""远离"：间距 = 100px

5. **画布边界约束**：所有计算出的坐标必须保证节点完整显示在画布内（x ≥ 0, y ≥ 0, x + width ≤ canvasWidth, y + height ≤ canvasHeight）。如果计算结果超出边界，自动调整到最近的合法位置并告知用户。

## 响应规范

- 每次工具调用后，用简洁的自然语言向用户确认操作结果。
- 如果指令含糊不清，主动询问澄清，不要猜测。
- 对于复杂操作，分步告知进度："已创建红色矩形，正在放置蓝色圆形..."
- 遇到工具调用失败时，向用户说明原因并建议替代方案。
```

---

# Part 3：工具与接口定义

> 本章定义 Voice-Driven Canvas 系统中所有 LLM 可调用工具（Function/Tool）的完整契约。工具是 LLM 与前端渲染层之间的唯一通信协议——LLM 不直接操作 DOM 或 Canvas 像素，仅输出符合本章 Schema 的结构化 JSON，由前端 Action Dispatcher 解析执行。

---

## 3.1 工具设计原则

### 3.1.1 四项核心契约

| 原则 | 定义 | 示例 |
|------|------|------|
| **纯函数语义** | 每个工具接收确定性参数，返回状态变更指令，不产生隐式副作用。 | `generate_shape(type, x, y, ...)` 仅创建节点，不自动触发对齐或缩放。 |
| **幂等性** | 相同参数重复调用结果一致。多次执行不叠加效果。 | `set_canvas_background({ color: "#FFF" })` 调用 1 次与调用 10 次，画布状态完全相同。 |
| **原子性** | 单次调用完成一个最小语义单元。复合意图由 LLM 拆解为多轮原子调用。 | `modify_node` 可一次修改多个属性，但不会同时创建新节点。 |
| **可回溯性** | 每次调用在 `actionLog` 中生成一条事务记录，支持 undo/redo。 | 执行 `generate_shape` 后，`actionLog.push({ tool, params, snapshot })`。 |

### 3.1.2 工具间职责边界与关系矩阵

| 工具 | 唯一职责 | 依赖 | 互斥 |
|------|---------|------|------|
| `generate_shape` | 创建几何图形节点 | 无 | 与 `clear_canvas` 语义冲突 |
| `modify_node` | 修改已有节点属性 | 目标节点必须存在 | 无 |
| `delete_node` | 删除指定节点 | 目标节点必须存在 | 与 `clear_canvas` 重叠 |
| `clear_canvas` | 清空全部节点并重置 | 无 | 与所有节点操作工具互斥 |
| `set_canvas_background` | 设置画布背景 | 无 | 无 |
| `add_text` | 创建文本节点 | `anchorTo` 可选依赖已有节点 | 无 |
| `generate_image` | 多模态图生图 | `sourceNode` 模式依赖已有图片节点 | 无 |
| `undo_action` | 撤销历史操作 | `actionLog` 非空 | 与 `redo_action` 对称 |
| `redo_action` | 重做已撤销操作 | 重做栈非空 | 与 `undo_action` 对称 |
| `spatial_align` | 空间对齐计算 | 至少 2 个节点存在 | 无 |
| `spatial_query` | 空间关系查询 | 至少 1 个节点存在 | 无（只读） |
| `reorder_node` | 调整叠放顺序 | 目标节点必须存在 | 无 |

---

## 3.2 核心工具 JSON Schema

以下 Schema 仅展示核心字段。装饰性可选属性详见 Appendix E。

### Tool 1：`generate_shape`

```json
{
  "name": "generate_shape",
  "description": "在画布上创建一个几何图形节点。支持 rect/circle/triangle/line/ellipse。返回新节点 ID、引用名和边界框。",
  "parameters": {
    "type": "object",
    "properties": {
      "type": { "type": "string", "enum": ["rect", "circle", "triangle", "line", "ellipse"], "description": "几何图形类型" },
      "x": { "type": "number", "description": "中心点 X 坐标" },
      "y": { "type": "number", "description": "中心点 Y 坐标" },
      "width": { "type": "number", "description": "宽度（px），rect/ellipse/line 有效" },
      "height": { "type": "number", "description": "高度（px），rect/ellipse/line 有效" },
      "radius": { "type": "number", "description": "半径（px），circle 有效" },
      "fill": { "type": "string", "description": "填充颜色", "default": "#000000" },
      "stroke": { "type": "string", "description": "描边颜色", "default": "transparent" },
      "strokeWidth": { "type": "number", "description": "描边宽度", "default": 0 },
      "rotation": { "type": "number", "description": "旋转角度（度）", "default": 0 },
      "opacity": { "type": "number", "minimum": 0, "maximum": 1, "default": 1 },
      "name": { "type": "string", "description": "节点引用名" }
    },
    "required": ["type", "x", "y"]
  }
}
```

### Tool 2：`modify_node`

```json
{
  "name": "modify_node",
  "description": "修改已有节点属性。支持部分更新，仅传入需变更的字段。",
  "parameters": {
    "type": "object",
    "properties": {
      "target": { "type": "string", "description": "目标节点 ID 或引用名" },
      "updates": {
        "type": "object",
        "description": "需更新的属性键值对",
        "properties": {
          "x": { "type": "number" }, "y": { "type": "number" },
          "width": { "type": "number" }, "height": { "type": "number" },
          "radius": { "type": "number" }, "fill": { "type": "string" },
          "stroke": { "type": "string" }, "strokeWidth": { "type": "number" },
          "rotation": { "type": "number" }, "opacity": { "type": "number" },
          "scaleX": { "type": "number" }, "scaleY": { "type": "number" }
        }
      }
    },
    "required": ["target", "updates"]
  }
}
```

### Tool 3：`delete_node`

```json
{
  "name": "delete_node",
  "description": "删除节点。支持精确删除（ID/name）、按类型批量删除（'all:rect'）、选择集删除（'selected'）。",
  "parameters": {
    "type": "object",
    "properties": {
      "target": { "type": "string", "description": "删除目标：节点 ID/name、'all:<type>' 或 'selected'" },
      "cascade": { "type": "boolean", "description": "是否同时删除锚定到目标的子节点", "default": false }
    },
    "required": ["target"]
  }
}
```

### Tool 4：`clear_canvas`

```json
{
  "name": "clear_canvas",
  "description": "清空画布所有节点。破坏性操作，必须 confirm=true 才执行。",
  "parameters": {
    "type": "object",
    "properties": {
      "confirm": { "type": "boolean", "description": "必须为 true 才执行", "default": false },
      "resetBackground": { "type": "boolean", "description": "是否同时重置背景为白色", "default": true }
    },
    "required": ["confirm"]
  }
}
```

### Tool 5：`set_canvas_background`

```json
{
  "name": "set_canvas_background",
  "description": "设置画布背景。支持纯色和渐变两种模式，二者互斥。",
  "parameters": {
    "type": "object",
    "properties": {
      "color": { "type": "string", "description": "背景颜色" },
      "gradient": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["linear", "radial"] },
          "stops": { "type": "array", "items": { "type": "object", "properties": { "offset": { "type": "number" }, "color": { "type": "string" } }, "required": ["offset", "color"] }, "minItems": 2 },
          "angle": { "type": "number", "default": 0 }
        },
        "required": ["type", "stops"]
      }
    }
  }
}
```

### Tool 6：`add_text`

```json
{
  "name": "add_text",
  "description": "添加文本节点。可独立定位或通过 anchorTo 锚定到已有节点。",
  "parameters": {
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "文本内容" },
      "x": { "type": "number", "description": "X 坐标" },
      "y": { "type": "number", "description": "Y 坐标" },
      "fontSize": { "type": "number", "default": 16 },
      "fontFamily": { "type": "string", "default": "Arial" },
      "fill": { "type": "string", "description": "文字颜色", "default": "#000000" },
      "anchorTo": { "type": "string", "description": "锚定目标节点 ID/name" },
      "anchorPosition": { "type": "string", "enum": ["top", "bottom", "left", "right", "center"], "default": "center" },
      "name": { "type": "string" }
    },
    "required": ["text", "x", "y"]
  }
}
```

### Tool 7：`generate_image`

```json
{
  "name": "generate_image",
  "description": "调用图像生成 API。省略 sourceNode 为文生图；提供 sourceNode 为图生图。",
  "parameters": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string", "description": "图像描述" },
      "sourceNode": { "type": "string", "description": "源图片节点（图生图模式）" },
      "style": { "type": "string", "enum": ["cartoon", "oil_painting", "watercolor", "pixel_art", "sketch", "realistic"] },
      "x": { "type": "number" }, "y": { "type": "number" },
      "width": { "type": "number", "default": 300 },
      "height": { "type": "number", "default": 300 }
    },
    "required": ["prompt"]
  }
}
```

### Tool 8：`undo_action`

```json
{
  "name": "undo_action",
  "description": "撤销最近的操作。支持指定步数批量撤销。",
  "parameters": {
    "type": "object",
    "properties": {
      "steps": { "type": "integer", "minimum": 1, "maximum": 50, "default": 1 }
    }
  }
}
```

### Tool 9：`redo_action`

```json
{
  "name": "redo_action",
  "description": "重做已撤销的操作。执行新工具时重做栈自动清空。",
  "parameters": {
    "type": "object",
    "properties": {
      "steps": { "type": "integer", "minimum": 1, "maximum": 50, "default": 1 }
    }
  }
}
```

### Tool 10：`spatial_align`

```json
{
  "name": "spatial_align",
  "description": "对齐节点。支持边缘对齐、居中、等距分布。前端执行精确几何计算。",
  "parameters": {
    "type": "object",
    "properties": {
      "targets": { "type": "array", "items": { "type": "string" }, "minItems": 2, "description": "待对齐节点列表" },
      "reference": { "type": "string", "description": "参考节点" },
      "alignment": { "type": "string", "enum": ["left", "right", "top", "bottom", "center-h", "center-v", "distribute-h", "distribute-v"] },
      "gap": { "type": "number", "description": "间距（px），distribute 模式有效", "default": 20 }
    },
    "required": ["targets", "alignment"]
  }
}
```

### Tool 11：`spatial_query`

```json
{
  "name": "spatial_query",
  "description": "查询空间关系。纯只读，不修改画布状态。",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "enum": ["nearest_to", "overlap_with", "inside_bounds", "left_of", "right_of", "above", "below"] },
      "reference": { "type": "string", "description": "参考节点" },
      "threshold": { "type": "number", "default": 50 },
      "bounds": { "type": "object", "properties": { "x": { "type": "number" }, "y": { "type": "number" }, "width": { "type": "number" }, "height": { "type": "number" } } }
    },
    "required": ["query", "reference"]
  }
}
```

### Tool 12：`reorder_node`

```json
{
  "name": "reorder_node",
  "description": "调整叠放顺序。支持置顶、置底、上移一层、下移一层。",
  "parameters": {
    "type": "object",
    "properties": {
      "target": { "type": "string", "description": "目标节点 ID/name" },
      "action": { "type": "string", "enum": ["bring_to_top", "send_to_back", "bring_forward", "send_backward"] }
    },
    "required": ["target", "action"]
  }
}
```

---

## 3.3 工具返回值规范

### 统一成功返回格式

```json
{
  "success": true,
  "nodeId": "node_a1b2c3",
  "name": "rect_01",
  "boundingBox": { "x": 325, "y": 225, "width": 150, "height": 150 },
  "message": "已创建矩形 rect_01"
}
```

### 统一失败返回格式

```json
{
  "success": false,
  "errorCode": "NODE_NOT_FOUND",
  "errorMessage": "未找到名为 'rect_99' 的节点",
  "suggestion": "请检查节点名称是否正确，或调用 spatial_query 查询当前画布上的节点列表"
}
```

### 错误码体系

| 错误码 | 触发场景 | 建议 LLM 行为 |
|--------|---------|--------------|
| `NODE_NOT_FOUND` | target 不存在 | 提示用户检查名称 |
| `SHAPE_EXCEEDS_CANVAS` | 尺寸/坐标超出画布 | 告知画布尺寸，建议缩小 |
| `INVALID_PARAMS` | 必填缺失、类型错误 | 提示参数格式 |
| `CANVAS_EMPTY` | 空画布上调用查询 | 提示先创建图形 |
| `CONFIRM_REQUIRED` | clear_canvas 未确认 | 向用户发起确认 |
| `HISTORY_EMPTY` | 无可撤销操作 | 提示无操作可撤销 |
| `REDO_STACK_EMPTY` | 无可重做操作 | 提示无操作可重做 |
| `NODE_LOCKED` | 节点正在异步处理 | 提示等待任务完成 |
| `ANCHOR_NOT_FOUND` | anchorTo 目标不存在 | 降级为绝对坐标 |
| `CROSS_TYPE_CONFLICT` | 不适用属性 | 忽略并返回警告 |
| `OPERATION_TIMEOUT` | 执行超时 | 建议简化或重试 |

---

## 3.4 多轮工具调用（Multi-round Tool Calling）

### 链式指令处理流程

```
User Voice: "画一个蓝色正方形，在上面写 Hello，然后居中对齐"
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│  Round 1: generate_shape(rect, blue, name:"rect_01")         │
└──────────────────────┬───────────────────────────────────────┘
                       │ → 成功，返回 rect_01 的 boundingBox
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Round 2: add_text("Hello", anchorTo:"rect_01", center)      │
└──────────────────────┬───────────────────────────────────────┘
                       │ → 成功，文本锚定到 rect_01 中心
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Round 3: spatial_align(["rect_01"], "__canvas__", center-h)  │
│          spatial_align(["rect_01"], "__canvas__", center-v)   │
│          ↑ 两个调用无依赖，可并行执行                           │
└──────────────────────┬───────────────────────────────────────┘
                       │ → 成功，rect_01 居中（文本因锚定自动跟随）
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  LLM 生成语音回复："已画好蓝色正方形，添加文字 Hello，居中对齐"  │
└──────────────────────────────────────────────────────────────┘
```

### 超时策略

| 维度 | 阈值 | 说明 |
|------|------|------|
| 单轮工具执行超时 | 5 秒 | 超时返回 `OPERATION_TIMEOUT` |
| 链式总超时 | 30 秒 | 超时终止后续轮次，播报"操作未全部完成" |
| LLM 单轮推理超时 | 10 秒 | 超时触发降级回复 |

### 重试策略

| 参数 | 值 |
|------|------|
| 最大重试次数 | 2 次 |
| 退避策略 | 指数退避（1s, 2s） |
| 可重试错误码 | `OPERATION_TIMEOUT`, `NETWORK_ERROR`, `API_RATE_LIMIT` |
| 不可重试错误码 | `INVALID_PARAMS`, `NODE_NOT_FOUND`, `CONFIRM_REQUIRED` |

### 中间态回滚

链式指令 A → B → C → D 中，若 C 失败（重试耗尽），执行 `undo_action(steps=2)` 撤销 B 和 A，恢复到链式起始状态。回滚本身不计入 actionLog。

### 并行 vs 串行判定

| 场景 | 执行方式 | 示例 |
|------|---------|------|
| 多个独立操作 | 并行 | "画一个圆和一个方块" → 并行 generate_shape × 2 |
| 后操作依赖前结果 | 串行 | "画一个圆然后涂红" → generate_shape → modify_node |
| 混合场景 | 部分并行 + 串行 | "画圆和方块，然后把圆涂红" → [并行创建] → [串行修改] |

---

# Part 4：异常处理与边界场景

> 本章定义 VDC 系统的容错架构，覆盖语音转录歧义、LLM 空间推理盲区、异步任务并发、全链路失败模式及数据持久化恢复机制。

---

## 4.1 语音转录容错

### 工程缓解策略

**策略 1：领域热词增强（Contextual Biasing）**

在 STT 解码阶段注入自定义词表，提升专有名词识别权重：

```json
{
  "speech_context": {
    "phrases": [
      "cyan", "magenta", "beige", "coral", "salmon", "turquoise",
      "ellipse", "polygon", "rectangle", "polyline", "bezier",
      "padding", "margin", "border-radius", "opacity", "z-index"
    ],
    "boost": 15.0
  }
}
```

**策略 2：LLM 纠错层**

在系统提示中嵌入结构化映射规则（见 2.3 节完整纠错表），LLM 在推理阶段自动修正 STT 输出。

**策略 3：模糊匹配回退**

前端维护同义词字典，对 LLM 输出仍存在的偏差进行编辑距离修正（Levenshtein distance ≤ 2）。

**策略 4：确认-回环机制**

高风险操作（删除、覆盖、批量修改）在执行前触发语音确认。

### 同音词纠错示例表

| STT 原始转录 | 纠错后（颜色） | STT 原始转录 | 纠错后（形状/CSS） |
|-------------|---------------|-------------|-------------------|
| 赛恩 / 赛因 | `cyan` (#00FFFF) | 以利普斯 | `ellipse` |
| 马真塔 / 品红 | `magenta` (#FF00FF) | 泡利贡 | `polygon` |
| 贝奇 / 贝吉 | `beige` (#F5F5DC) | 瑞克唐哥 | `rectangle` |
| 珊瑚 / 山瑚 | `coral` (#FF7F50) | 弗莱克斯 | `flex` |
| 萨蒙 / 三文鱼 | `salmon` (#FA8072) | 格瑞德 | `grid` |
| 绿松石 / 土耳其 | `turquoise` (#40E0D0) | 帕丁 | `padding` |
| 靛青 / 靛蓝 | `indigo` (#4B0082) | 波德瑞迪厄斯 | `border-radius` |
| 栗色 / 深红 | `maroon` (#800000) | Z 因戴克斯 | `z-index` |
| 藏青 / 海军蓝 | `navy` (#000080) | 马金 | `margin` |
| 橄榄 / 橄榄绿 | `olive` (#808000) | 奥帕西提 | `opacity` |

---

## 4.2 LLM 的"盲区推理"：缺乏原生二维空间视觉

### 问题本质

LLM 是纯文本序列模型，其内部表征是离散符号（token），不存在对连续二维几何空间的原生理解。当用户说"把圆形移到矩形右边对齐"，LLM 无法"看见"画布上各元素的实际坐标，只能依赖上下文中以文本形式注入的空间描述进行推理。

### 根本瓶颈：离散符号 vs 连续几何

| 维度 | LLM 能力 | 空间推理需求 |
|------|---------|-------------|
| 坐标理解 | 可解析文本数字 | 需要视觉直觉判断重叠/遮挡 |
| 对齐关系 | 需显式描述 | 人眼瞬间可判别 |
| 距离估算 | 可做算术运算 | 需要比例感知 |
| 空间布局 | 可遵循规则 | 需要格式塔直觉 |

### 工程缓解策略

**策略 A：空间查询/对齐工具委托**

定义 `spatial_align` 和 `spatial_query` 工具（见 3.2 节 Tool 10/11），将空间计算委托给前端确定性算法。

**适用场景**：精确对齐操作（"让这三个按钮水平等距分布"）。LLM 生成工具调用，前端执行几何计算并返回结果。

**策略 B：空间上下文注入**

前端自动计算所有节点的空间关系，以结构化自然语言注入 LLM 上下文：

```
## 当前画布空间状态
画布尺寸: 1200 x 800 px

### 元素列表 (按 z-index 降序)
1. [rect-1] 红色矩形 @ (100, 100), 200x150, z-index: 3
2. [circle-1] 蓝色圆形 @ (350, 120), 半径 60, z-index: 2
3. [text-1] 标题文字 @ (100, 50), 300x40, z-index: 4

### 空间关系摘要
- circle-1 在 rect-1 右侧，水平间距 50px，垂直偏移 +20px
- text-1 在 rect-1 正上方，垂直间距 10px
- 无元素重叠
- rect-1 与 text-1 左对齐 (x=100)
```

**适用场景**：需要空间推理的自由指令（"把圆形移到矩形和文字之间"）。

**策略 C：语音引导的渐进式对齐**

多轮对话逐步微调，每轮仅执行小幅度位移：

```
第1轮: 用户: "把圆形往右移一点"  → 系统: [移动 20px] "已右移，间距 70px"
第2轮: 用户: "再往右一点"        → 系统: [移动 20px] "已右移，间距 90px"
第3轮: 用户: "差不多了，对齐上面"  → 系统: [顶部对齐] "已与矩形顶部对齐"
```

**适用场景**：用户对精确位置无明确数值要求，依赖视觉反馈迭代调整。

---

## 4.3 异步长耗时任务的并发与打断处理

### UI 状态锁定策略

| 状态 | 语音输入 | 画布操作 | UI 表现 |
|------|---------|---------|---------|
| IDLE | 允许 | 允许 | 正常光标 |
| PROCESSING | 允许（排队） | 禁止修改目标元素 | 加载动画 + "生成中"提示 |
| INTERRUPTING | 暂停接收 | 禁止 | "正在取消..." |
| ERROR | 允许 | 允许 | 错误提示 + 重试按钮 |

### 打断后的指令队列处理

```typescript
enum QueuePolicy {
  QUEUE = 'queue',         // 排队等待当前任务完成
  DISCARD = 'discard',     // 丢弃矛盾指令
  CANCEL_CURRENT = 'cancel' // 取消当前，立即执行新指令
}
```

### 超时降级策略

| 超时阶段 | 时间 | 动作 |
|---------|------|------|
| 正常轮询 | 0-15s | 每 2s 查询进度 |
| 警告阈值 | 15s | UI 显示"仍在处理..." |
| 软超时 | 30s | 语音提示"生成较慢，继续等待或取消" |
| 硬超时 | 60s | 自动取消，提示用户重试 |

### 状态机图

```
               ┌─────────┐   用户发出指令   ┌─────────────┐
               │  IDLE   │ ──────────────→ │ PROCESSING  │
               └─────────┘                 └──────┬──────┘
                    ▲                             │    │
          任务完成  │         用户说"取消"        ▼    │ 任务完成
          / 错误恢复│                      ┌──────────┐│
                    │                      │INTERRUPT ││
                    └──────────────────────┴──────────┘│
                                              取消完成  ▼
                                       ┌───────────────────┐
                                       │    COMPLETED      │
                                       └───────────────────┘
```

---

## 4.4 完整的失败模式矩阵（Failure Mode Matrix）

| 失败点 | 症状 | 缓解策略 | 恢复机制 |
|--------|------|---------|---------|
| **STT 转录错误** | 颜色/形状名被误识别 | 4.1 节四层容错 | 用户说"不对，我说的是 cyan"触发纠正 |
| **LLM 幻觉与坐标漂移** | 生成不存在的元素 ID 或超出画布的坐标 | 坐标 clamp；元素 ID 校验 | 前端校验层拦截，返回错误供 LLM 重试 |
| **WebSocket 断连** | 语音流中断，状态不同步 | 心跳 15s；指数退避重连 1s→max 30s | 重连后全量快照同步；断连指令缓存重放 |
| **图像 API 超时** | 图生图长时间无响应 | 软超时 30s 提示 → 硬超时 60s 取消 | 降级为纯色占位矩形 |
| **多轮对话上下文溢出** | LLM 丢失早期指令 | 滑动窗口保留最近 20 轮；关键状态始终注入 | 主动提示"已保留最近操作" |
| **浏览器兼容性** | 语音 API 不可用 | Feature Detection | 降级为文本输入 + 静态 SVG |
| **麦克风授权被拒绝** | 无法采集音频 | 启动时检测权限，引导弹窗 | 降级为文本输入框 |
| **网络抖动** | API 请求间歇性失败 | 重试 3 次 + 指数退避；离线队列 | 网络恢复后自动重试 |
| **指代消解失败** | "它"无法确定指向 | 最近操作元素 + 鼠标悬停 + 显式提及 | 追问"您是指 [最近操作的矩形] 吗？" |
| **指令冲突与不可能操作** | "把圆形变成正方形" | LLM 约束 + 前端几何校验 | 返回语义化错误 + 替代方案 |
| **LLM 服务不可用** | API 返回 500/503/429 | 本地轻量 fallback（正则 + 关键词） | 降级支持基础操作 |
| **音频回声/反馈** | 语音播报被麦克风二次采集 | 播报期间暂停 STT（VAD 联动） | 播报结束延迟 500ms 恢复监听 |

---

## 4.5 数据持久化与恢复

### JSON 状态自动保存

采用 debounce 3s 机制，以 IndexedDB 作为持久化存储：

```typescript
class StatePersistence {
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 3000;

  scheduleSave(state: CanvasState): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveToIndexedDB(state), this.DEBOUNCE_MS);
  }

  async restore(): Promise<CanvasState | null> {
    const record = await db.canvas.get('current');
    return record ? JSON.parse(record.state) : null;
  }
}
```

### 断线重连后的状态同步

采用全量快照 + 增量 diff 混合策略：

```
客户端版本落后 ≤ 10 个版本 → 增量同步（发送 diff 列表）
客户端版本落后 > 10 个版本 → 全量同步（发送完整快照）
```

### 操作队列持久化

断连期间指令缓存至 localStorage（同步写入，断电安全），重连后按序重放。队列数据量小（< 100 条），localStorage 5MB 限制不会成为瓶颈。

### 冲突解决策略

| 冲突类型 | 策略 |
|---------|------|
| 同一元素属性冲突 | Last-Write-Wins（最新时间戳胜出） |
| 元素删除 vs 修改 | 删除优先 |
| 元素创建冲突（同 ID） | UUID 去重 |
| 画布缩放/旋转冲突 | 用户选择 |

---

# Part 5：附录

---

## Appendix A：技术栈参考表

| 层级 | 技术 | 版本 | 角色说明 | 开源协议 |
|------|------|------|----------|----------|
| Voice Pipeline (STT) | Deepgram Nova-2 | v2024-01 | 实时语音转文本 | 商业许可 |
| Voice Pipeline (TTS) | ElevenLabs | v1.0 | 文本转语音，多语言情感合成 | 商业许可 |
| LLM (主力) | GPT-4o | 2024-08-06 | 意图识别、工具调用、多轮推理 | 商业许可 |
| LLM (备选) | Claude 3.5 Sonnet | 20241022 | 复杂推理与代码生成 | 商业许可 |
| Rendering Engine | Konva.js | ^9.2 | Canvas 2D 保留模式渲染 | MIT |
| State Management | Zustand | ^4.5 | 轻量级状态管理 | MIT |
| State Schema | JSON Canvas | 1.0 | 画布状态序列化格式 | 自定义规范 |
| Image Generation | Stability AI SDXL | v1.0 | 文本到图像生成 | 商业许可 |
| Image Generation (备选) | DALL·E 3 | 2024-08 | 创意场景图像生成 | 商业许可 |
| Transport | WebSocket (ws) | ^8.16 | 全双工实时通信 | MIT |
| Persistence | IndexedDB (Dexie) | ^4.0 | 浏览器端持久化存储 | Apache-2.0 |
| UI Framework | React | ^18.3 | 前端 UI 框架 | MIT |
| Build Tool | Vite | ^5.4 | 开发服务器与构建工具 | MIT |
| Monorepo Manager | pnpm | ^9.0 | 包管理与工作区管理 | MIT |
| 测试框架 | Vitest | ^2.0 | 单元测试与集成测试 | MIT |

---

## Appendix B：JSON Canvas 完整状态 Schema

```typescript
interface CanvasState {
  meta: CanvasMeta;
  nodes: Node[];
  edges: Edge[];
  actionLog: ActionEntry[];
  undoStack: Partial<CanvasState>[];
  redoStack: Partial<CanvasState>[];
}

interface CanvasMeta {
  version: string;              // 格式 "x.y.z"
  viewport: Viewport;
  createdAt: string;            // ISO 8601
  updatedAt: string;
}

interface Viewport {
  x: number;                    // 默认 0
  y: number;                    // 默认 0
  scale: number;                // 默认 1.0，范围 [0.1, 10]
  width: number;
  height: number;
}

interface Node {
  id: string;                   // UUID v4
  type: NodeType;               // "rect" | "circle" | "text" | "image" | "path" | "group" | "line"
  x: number;
  y: number;
  width?: number;               // rect/image 必填，>= 0
  height?: number;
  radius?: number;              // circle 必填，>= 0
  rotation: number;             // 默认 0，[0, 360)
  fill: string;                 // 默认 "transparent"
  stroke: string;               // 默认 "transparent"
  strokeWidth: number;          // 默认 0，[0, 100]
  opacity: number;              // 默认 1.0，[0, 1]
  text?: string;                // text 类型必填
  fontSize?: number;            // 默认 16，[1, 1000]
  imageUrl?: string;            // image 类型必填
  zIndex: number;               // 默认 0
  locked: boolean;              // 默认 false
  visible: boolean;             // 默认 true
  children: string[];           // 默认 []
  metadata: Record<string, unknown>;
}

interface Edge {
  id: string;
  from: string;                 // 引用 Node.id
  to: string;                   // 引用 Node.id
  label?: string;
  style: EdgeStyle;
}

interface EdgeStyle {
  stroke: string;               // 默认 "#333333"
  strokeWidth: number;          // 默认 2，[1, 20]
  dash: number[];               // 默认 []
  type: "solid" | "dashed" | "dotted";
  arrowEnd: "none" | "arrow" | "circle";
}

interface ActionEntry {
  timestamp: number;            // Unix ms
  type: ActionType;
  nodeId: string;
  beforeState: Partial<Node>;
  afterState: Partial<Node>;
}

type ActionType = "create" | "update" | "delete" | "move" | "resize" | "rotate" | "style" | "reorder" | "group" | "ungroup";
```

**约束条件**：
- `Node.id` 在 nodes 数组中必须唯一
- `Edge.from` 和 `Edge.to` 必须引用已存在的 `Node.id`
- `undoStack` 最大深度 50，`actionLog` 最大长度 1000（环形缓冲）
- `circle` 类型 `radius` 必填；`text` 类型 `text` 和 `fontSize` 必填；`image` 类型 `imageUrl` 必填

---

## Appendix C：API 端点设计

### 1. 保存画布
- **POST** `/api/canvas/:id/save`
- Request: `{ canvasState, commitMessage?, clientTimestamp }`
- Response: `{ success, version, savedAt }`
- Status: 200 / 400 / 404 / 409（版本冲突） / 500

### 2. 加载画布
- **GET** `/api/canvas/:id?version=string`
- Response: `{ id, canvasState, version, updatedAt }`
- Status: 200 / 404 / 500

### 3. 图像生成代理
- **POST** `/api/image/generate`
- Request: `{ prompt, negativePrompt?, width, height, style, provider? }`
- Response: `{ imageUrl, metadata: { provider, model, seed } }`
- Status: 200 / 400（内容策略） / 429（频率限制） / 502

### 4. 获取版本历史
- **GET** `/api/canvas/:id/history?limit=20&offset=0`
- Response: `{ versions: [{ version, commitMessage, createdAt, changesCount }], total }`

### 5. 导出画布
- **POST** `/api/canvas/:id/export`
- Request: `{ format, quality, includeBackground, region }`
- Response: `{ downloadUrl, format, fileSize }`

---

## Appendix D：项目目录结构建议

```
voice-driven-canvas/
├── apps/
│   ├── web/                          # 主 Web 应用
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── canvas/           # 画布组件
│   │   │   │   ├── toolbar/          # 工具栏
│   │   │   │   └── voice/            # 语音控制 UI
│   │   │   ├── hooks/
│   │   │   ├── stores/               # Zustand 状态仓库
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   └── api/                          # 后端 API 服务（可选）
│       └── src/
│           ├── routes/
│           ├── controllers/
│           ├── services/
│           └── index.ts
├── packages/
│   ├── shared/                       # 共享类型/常量/工具
│   │   └── src/
│   │       ├── types/                # CanvasState 等类型
│   │       ├── constants/
│   │       ├── schemas/              # Zod 校验
│   │       └── utils/
│   ├── voice-agent/                  # 语音 Agent 核心
│   │   └── src/
│   │       ├── pipeline/             # STT/TTS 流水线
│   │       ├── agent/                # LLM Agent 逻辑
│   │       │   └── tools/            # 工具定义
│   │       └── prompts/              # Prompt 模板
│   └── canvas-engine/                # 画布渲染引擎
│       └── src/
│           ├── renderer/             # Konva 渲染
│           ├── operations/           # 图形操作
│           ├── history/              # 撤销/重做
│           └── serialization/        # 状态序列化
├── docs/
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Appendix E：工具 Schema 详细版（装饰性可选属性）

以下属性为**装饰性可选属性**，仅在本附录中定义。

```json
{
  "title": "DecorativeNodeExtensions",
  "properties": {
    "shadow": {
      "description": "阴影效果",
      "properties": {
        "shadowColor": { "type": "string", "default": "rgba(0,0,0,0.5)" },
        "shadowBlur": { "type": "number", "minimum": 0, "maximum": 100, "default": 5 },
        "shadowOffsetX": { "type": "number", "minimum": -100, "maximum": 100, "default": 2 },
        "shadowOffsetY": { "type": "number", "minimum": -100, "maximum": 100, "default": 2 }
      }
    },
    "gradient": {
      "description": "渐变填充（与 fill 互斥）",
      "oneOf": [
        { "fillLinearGradient": { "startPoint": "Point", "endPoint": "Point", "colorStops": "ColorStop[]" } },
        { "fillRadialGradient": { "innerCircle": "Circle", "outerCircle": "Circle", "colorStops": "ColorStop[]" } }
      ]
    },
    "typography": {
      "description": "字体变体（仅 text 类型）",
      "properties": {
        "fontStyle": { "enum": ["normal", "italic", "oblique"] },
        "fontVariant": { "enum": ["normal", "small-caps"] },
        "textDecoration": { "enum": ["none", "underline", "line-through"] },
        "letterSpacing": { "type": "number", "minimum": -20, "maximum": 50 },
        "lineHeight": { "type": "number", "minimum": 0.5, "maximum": 5.0, "default": 1.4 }
      }
    },
    "clip": {
      "description": "图片裁剪（仅 image 类型）",
      "properties": {
        "clipX": { "type": "number", "minimum": 0 },
        "clipY": { "type": "number", "minimum": 0 },
        "clipWidth": { "type": "number", "minimum": 1 },
        "clipHeight": { "type": "number", "minimum": 1 }
      }
    }
  }
}
```

**使用说明**：
- 渐变属性与 `fill` 互斥
- 字体变体仅在 `type === "text"` 时生效
- 裁剪属性仅在 `type === "image"` 时生效

---

> **文档版本**：2.0 | **最后更新**：2026-06-13
