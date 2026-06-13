/**
 * VoiceButton — 悬浮语音控制按钮
 *
 * 显示麦克风状态和当前 Agent 模式。
 * 点击切换语音监听的开启/关闭。
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
}

export function VoiceButton({
  status,
  mode,
  isListening,
  error,
  userTranscript,
  agentResponse,
  onToggle,
}: VoiceButtonProps) {
  const statusText = getStatusText(status, mode);
  const buttonColor = getButtonColor(status);
  const pulseAnim = status === "connected" && mode === "listening";

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={onToggle}
        disabled={status === "connecting" || status === "disconnecting"}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "none",
          background: buttonColor,
          color: "#fff",
          fontSize: 24,
          cursor: status === "connecting" || status === "disconnecting" ? "wait" : "pointer",
          boxShadow: `0 4px 20px ${buttonColor}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          transition: "all 0.3s ease",
          animation: pulseAnim ? "vdc-pulse 1.5s infinite" : "none",
          opacity: status === "connecting" || status === "disconnecting" ? 0.7 : 1,
        }}
        title={isListening ? "停止监听" : "开始监听"}
      >
        {status === "connecting" ? "⏳" : isListening ? "🎙️" : "🎤"}
      </button>

      {/* 状态指示器 */}
      <div
        style={{
          position: "fixed",
          bottom: 108,
          right: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {/* 状态文本 */}
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            whiteSpace: "nowrap",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isListening ? "#4CAF50" : status === "connecting" ? "#FF9800" : "#9E9E9E",
              marginRight: 8,
              verticalAlign: "middle",
            }}
          />
          {statusText}
        </div>

        {/* 用户转录 */}
        {isListening && userTranscript && (
          <div
            style={{
              background: "rgba(33,150,243,0.85)",
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
            }}
          >
            🗣️ {userTranscript}
          </div>
        )}

        {/* Agent 回复 */}
        {isListening && agentResponse && (
          <div
            style={{
              background: "rgba(76,175,80,0.85)",
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
            }}
          >
            🤖 {agentResponse}
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div
            style={{
              background: "rgba(244,67,54,0.85)",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: 12,
              fontSize: 12,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              maxWidth: 280,
              backdropFilter: "blur(8px)",
            }}
          >
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

function getStatusText(status: AgentStatus, mode: AgentMode): string {
  switch (status) {
    case "disconnected":
      return "点击开始语音控制";
    case "connecting":
      return "正在连接...";
    case "disconnecting":
      return "正在断开...";
    case "connected":
      return mode === "listening" ? "Listening..." : "Speaking...";
  }
}

function getButtonColor(status: AgentStatus): string {
  switch (status) {
    case "disconnected":
      return "#607D8B";
    case "connecting":
      return "#FF9800";
    case "connected":
      return "#4CAF50";
    case "disconnecting":
      return "#9E9E9E";
  }
}
