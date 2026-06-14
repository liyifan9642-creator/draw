/**
 * VoiceButton — 悬浮语音控制按钮
 *
 * 显示麦克风状态和当前 Agent 模式。
 * 点击切换语音监听的开启/关闭。
 * TTS 播放时显示停止按钮。
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
  const pulseAnim = status === "listening";
  const isDisabled = status === "connecting" || status === "thinking";

  return (
    <>
      {/* 悬浮按钮组 */}
      <div style={buttonGroupStyle}>
        {/* TTS 停止按钮（播放时出现） */}
        {isSpeaking && onStopTts && (
          <button
            onClick={onStopTts}
            style={stopButtonStyle}
            title="停止语音播放"
          >
            ⏹
          </button>
        )}

        {/* 主按钮 */}
        <button
          onClick={onToggle}
          disabled={isDisabled}
          style={{
            ...mainButtonStyle,
            background: buttonColor,
            cursor: isDisabled ? "wait" : "pointer",
            boxShadow: `0 4px 20px ${buttonColor}66`,
            animation: pulseAnim ? "vdc-pulse 1.5s infinite" : "none",
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
        <div style={statusTextStyle}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: status === "listening" ? "#4CAF50" : status === "thinking" ? "#9C27B0" : status === "speaking" ? "#2196F3" : status === "connecting" ? "#FF9800" : "#9E9E9E",
              marginRight: 8,
              verticalAlign: "middle",
            }}
          />
          {statusText}
        </div>

        {/* 用户转录 */}
        {isListening && userTranscript && (
          <div style={bubbleStyle("rgba(33,150,243,0.85)")}>
            🗣️ {userTranscript}
          </div>
        )}

        {/* Agent 回复 */}
        {isListening && agentResponse && (
          <div style={bubbleStyle("rgba(76,175,80,0.85)")}>
            🤖 {agentResponse}
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div style={bubbleStyle("rgba(244,67,54,0.85)")}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* 脉冲动画 CSS */}
      <style>{`
        @keyframes vdc-pulse {
          0% { box-shadow: 0 0 0 0 ${buttonColor}66; }
          70% { box-shadow: 0 0 0 16px ${buttonColor}00; }
          100% { box-shadow: 0 0 0 0 ${buttonColor}00; }
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
  gap: 8,
  zIndex: 9999,
};

const mainButtonStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  border: "none",
  color: "#fff",
  fontSize: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s ease",
};

const stopButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "#F44336",
  color: "#fff",
  fontSize: 16,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(244,67,54,0.4)",
  transition: "all 0.2s ease",
};

const statusPanelStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 116,
  right: 32,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 6,
  zIndex: 9999,
  pointerEvents: "none",
};

const statusTextStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.75)",
  color: "#fff",
  padding: "6px 14px",
  borderRadius: 20,
  fontSize: 13,
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  whiteSpace: "nowrap",
  backdropFilter: "blur(8px)",
};

const bubbleStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: "#fff",
  padding: "6px 14px",
  borderRadius: 12,
  fontSize: 12,
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  maxWidth: 280,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backdropFilter: "blur(8px)",
});

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
    case "disconnected": return "#607D8B";
    case "connecting": return "#FF9800";
    case "listening": return "#4CAF50";
    case "thinking": return "#9C27B0";
    case "speaking": return "#2196F3";
    case "connected": return "#4CAF50";
  }
}
