/**
 * VoiceButton — 悬浮语音控制按钮
 *
 * 显示麦克风状态和当前 Agent 模式。
 * 点击切换语音监听的开启/关闭。
 * TTS 播放时显示停止按钮。
 *
 * V2.1: UI/UX Pro Max — 玻璃拟态 + 增强光效
 */

import type { AgentMode, AgentStatus } from "../hooks/useVoiceAgent";

interface VoiceButtonProps {
  status: AgentStatus;
  mode: AgentMode;
  isListening: boolean;
  error: string | null;
  userTranscript: string;
  agentResponse: string;
  onToggle: () => void;
  /** 是否正在 TTS 播放 */
  isSpeaking?: boolean;
  /** 停止 TTS 播放 */
  onStopTts?: () => void;
}

export function VoiceButton({
  status,
  mode,
  isListening,
  error,
  userTranscript,
  agentResponse,
  onToggle,
  isSpeaking = false,
  onStopTts,
}: VoiceButtonProps) {
  const statusText = getStatusText(status, mode);
  const buttonColor = getButtonColor(status);
  const isDisabled = status === "connecting" || status === "thinking";

  return (
    <>
      {/* 悬浮按钮组 */}
      <div style={buttonGroupStyle}>
        {/* TTS 停止按钮（播放时出现） */}
        {isSpeaking && onStopTts && (
          <button
            onClick={onStopTts}
            className="vdc-stop-btn"
            title="停止语音播放"
          >
            ⏹
          </button>
        )}

        {/* 主按钮 */}
        <button
          onClick={onToggle}
          disabled={isDisabled}
          className={`vdc-voice-btn ${status === "listening" ? "vdc-voice-btn--listening" : ""}`}
          style={{
            background: `linear-gradient(135deg, ${buttonColor}, ${adjustColor(buttonColor, -20)})`,
            cursor: isDisabled ? "wait" : "pointer",
            boxShadow: `0 4px 24px ${buttonColor}55, 0 0 60px ${buttonColor}22`,
            opacity: isDisabled ? 0.7 : 1,
          }}
          title={isListening ? "停止监听" : "开始监听"}
        >
          {status === "connecting" ? "⏳" : status === "thinking" ? "🧠" : isListening ? "🎙️" : "🎤"}
        </button>
      </div>

      {/* 状态指示器 */}
      <div style={statusPanelStyle}>
        {/* 状态文本 */}
        <div
          className="vdc-voice-status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: status === "listening" ? "#64ffda" : status === "thinking" ? "#b388ff" : status === "speaking" ? "#82b1ff" : status === "connecting" ? "#ffab40" : "rgba(150, 160, 200, 0.4)",
              boxShadow: status === "listening" ? "0 0 10px #64ffda" : status === "thinking" ? "0 0 10px #b388ff" : "none",
              verticalAlign: "middle",
              flexShrink: 0,
            }}
          />
          {statusText}
        </div>

        {/* 用户转录 */}
        {isListening && userTranscript && (
          <div
            className="vdc-voice-bubble"
            style={{
              background: "rgba(92, 107, 192, 0.25)",
              color: "#c5cae9",
            }}
          >
            🗣️ {userTranscript}
          </div>
        )}

        {/* Agent 回复 */}
        {isListening && agentResponse && (
          <div
            className="vdc-voice-bubble"
            style={{
              background: "rgba(38, 198, 218, 0.2)",
              color: "#b2ebf2",
            }}
          >
            🤖 {agentResponse}
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div
            className="vdc-voice-bubble"
            style={{
              background: "rgba(255, 64, 129, 0.2)",
              color: "#ff80ab",
            }}
          >
            ❌ {error}
          </div>
        )}
      </div>

      {/* 脉冲动画 CSS */}
      <style>{`
        @keyframes vdc-pulse {
          0% { box-shadow: 0 0 0 0 ${buttonColor}55, 0 0 40px ${buttonColor}22; }
          70% { box-shadow: 0 0 0 20px ${buttonColor}00, 0 0 60px ${buttonColor}11; }
          100% { box-shadow: 0 0 0 0 ${buttonColor}00, 0 0 40px ${buttonColor}22; }
        }
      `}</style>
    </>
  );
}

// ─── 样式 ────────────────────────────────────────────────────

const buttonGroupStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 32,
  right: 32,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  zIndex: 9999,
};

const statusPanelStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 120,
  right: 32,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
  zIndex: 9999,
  pointerEvents: "none",
};

// ─── 工具函数 ────────────────────────────────────────────────

function getStatusText(status: AgentStatus, mode: AgentMode): string {
  switch (status) {
    case "disconnected": return "点击开始语音控制";
    case "connecting": return "正在连接...";
    case "listening": return "Listening...";
    case "thinking": return "Thinking...";
    case "speaking": return "Speaking...";
    case "connected": return "Ready";
  }
}

function getButtonColor(status: AgentStatus): string {
  switch (status) {
    case "disconnected": return "#455a64";
    case "connecting": return "#ff9800";
    case "listening": return "#00c853";
    case "thinking": return "#7c4dff";
    case "speaking": return "#5c6bc0";
    case "connected": return "#00c853";
  }
}

/** 简单的颜色亮度调整 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
