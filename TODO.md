# VDC (Voice-Driven Canvas) — 开发进度跟踪

> **项目**：AI 语音绘图工具 | **创建日期**：2026-06-13

---

## Phase 0: 项目初始化 ✅ 已完成

- [x] 阅读 PRD & Architecture 文档
- [x] 初始化 pnpm monorepo 根配置（package.json / pnpm-workspace.yaml / tsconfig.base.json）
- [x] 创建目录结构（apps/web, apps/api, packages/shared, packages/canvas-engine, packages/voice-agent）
- [x] 初始化 apps/web（React 18 + Vite 5 + Konva 9 + Zustand 4 + Dexie 4）
- [x] 初始化 packages/shared（CanvasState 类型定义 + 全局常量 + 语音纠错映射表）
- [x] 初始化 packages/canvas-engine（骨架）
- [x] 初始化 packages/voice-agent（骨架）
- [x] 初始化 apps/api（骨架）
- [x] 验证 pnpm install & build 通过

## Phase 1: 核心画布引擎 ⬅ 当前阶段

- [x] CanvasState 类型定义（Node / Edge / ActionEntry）→ `packages/shared/src/types/`
- [x] 状态机 CanvasStore 实现（纯数据层，无渲染依赖）→ `packages/canvas-engine/src/store.ts`
- [x] History Stack（undo / redo / undoSteps / redoSteps）→ 55 个单元测试全部通过
- [x] 画布背景控制（setBackground / clearCanvas）
- [x] 图形操作工具（addNode / updateNode / deleteNode / deleteNodesByType）
- [x] 边操作（addEdge / deleteEdge）
- [x] 空间操作（moveNode / resizeNode / rotateNode / reorderNode）
- [ ] Konva 渲染层（Stage / Layer / 基础图形组件）

## Phase 2: 语音管线集成

- [ ] WebSocket Client 封装
- [ ] Deepgram STT 集成（实时语音转文本）
- [ ] ElevenLabs TTS 集成（文本转语音反馈）
- [ ] Action Dispatcher（tool_calls 解析 → Store 操作）
- [ ] LLM 系统提示词注入
- [ ] 语音转录纠错映射表

## Phase 3: 高级图形能力

- [ ] 文本节点（add_text + 排版）
- [ ] 图像生成联动（generate_image + Stability AI / DALL·E）
- [ ] 空间对齐工具（spatial_align）
- [ ] 空间查询工具（spatial_query）
- [ ] 叠放顺序控制（reorder_node）
- [ ] 批量删除 / 清空画布（delete_node + clear_canvas）

## Phase 4: 状态持久化与恢复

- [ ] IndexedDB 持久化（Dexie 封装）
- [ ] 自动保存（debounce 3s）
- [ ] 断线重连状态同步
- [ ] 操作队列持久化

## Phase 5: 用户体验完善

- [ ] 首次使用引导流程（Onboarding）
- [ ] 文本输入降级模式
- [ ] 键盘快捷键（Ctrl+Z/Y, Delete, Tab）
- [ ] 响应式布局（Desktop / Tablet / Mobile）
- [ ] ARIA 无障碍标签

## Phase 6: 协作与导出

- [ ] 多人实时协作（CRDT / OT）
- [ ] 画布导出（PNG / SVG）
- [ ] 云端同步与版本历史

## Phase 7: 测试与优化

- [ ] 单元测试（Vitest）
- [ ] 集成测试
- [ ] 性能优化（Konva 帧率 ≥ 60fps @ 10 节点）
- [ ] 端到端延迟 P95 ≤ 1.5s 验证
