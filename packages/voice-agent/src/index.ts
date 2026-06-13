/**
 * @vdc/voice-agent — 语音 Agent 核心
 *
 * 负责：
 * - STT 流水线（Deepgram / Whisper 实时语音转文本）
 * - LLM Agent 逻辑（GPT-4o / Claude 意图识别 + 工具调用）
 * - TTS 流水线（ElevenLabs / Deepgram Aura 文本转语音）
 * - 工具注册与调用分发
 * - Prompt 模板管理
 *
 * TODO: Phase 2 实现
 */
