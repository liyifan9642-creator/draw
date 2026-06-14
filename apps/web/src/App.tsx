/**
 * VDC Dev Sandbox — Konva 渲染层 + 文本/语音控制
 *
 * 控制模式：
 *   文本模式：在输入框中输入自然语言指令，回车或点击发送
 *   语音模式：点击右下角悬浮按钮开启语音监听（需配置 VITE_MIMO_API_KEY）
 *
 * V2.0: 使用 mimo-v2.5-pro 替代 ElevenLabs 作为 LLM 后端
 * V2.1: UI/UX Pro Max — 玻璃拟态 + 粒子背景 + 现代字体
 */

import { useEffect, useRef, useState } from "react";
import { CanvasStore, KonvaRenderer } from "@vdc/canvas-engine";
import { useVoiceAgent } from "./hooks/useVoiceAgent";
import { setCanvasSize } from "@vdc/voice-agent";
import { VoiceButton } from "./components/VoiceButton";
import { TextInput } from "./components/TextInput";
import { AnimatedBackground } from "./components/AnimatedBackground";

/** 画布尺寸常量（与 KonvaRenderer 初始化一致） */
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

/** localStorage 存储键（与 CanvasStore 一致） */
const STORAGE_KEY = "vdc-canvas-state";

// ─── 状态日志组件 ────────────────────────────────────────────

interface LogEntry {
  time: string;
  message: string;
  color: string;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeCount, setNodeCount] = useState(0);
  const [background, setBackground] = useState("#FFFFFF");
  const [undoDepth, setUndoDepth] = useState(0);
  const [storeReady, setStoreReady] = useState(false);

  // 共享 Store 实例（优先从 localStorage 恢复）
  const storeRef = useRef<CanvasStore>(CanvasStore.hydrate());
  const store = storeRef.current;

  const addLog = (message: string, color = "#4CAF50") => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev.slice(-49), { time, message, color }]);
  };

  // ─── 导出画布 ──────────────────────────────────────────────

  const handleExport = () => {
    const data = store.toJSON();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing.canvas";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog("📤 画布已导出为 drawing.canvas", "#26c6da");
  };

  // ─── 导入画布 ──────────────────────────────────────────────

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const result = store.importState(data);

        if (result.success) {
          addLog(`📥 ${result.message}`, "#64ffda");
        } else {
          addLog(`❌ 导入失败: ${result.errorMessage}`, "#ff4081");
        }
      } catch (err) {
        addLog(`❌ 文件解析失败: ${err instanceof Error ? err.message : "未知错误"}`, "#ff4081");
      }
    };
    reader.readAsText(file);

    // 重置 input 以便重复选择同一文件
    e.target.value = "";
  };

  // 初始化渲染器
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new KonvaRenderer(store, {
      container: containerRef.current,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });

    // 同步画布尺寸到工具上下文（供 position 解析使用）
    setCanvasSize(CANVAS_WIDTH, CANVAS_HEIGHT);

    // 订阅 Store 变更，同步 UI 状态
    const unsub = store.subscribe(() => {
      setNodeCount(store.nodeCount);
      setBackground(store.getBackground());
      setUndoDepth(store.undoDepth);
    });

    setStoreReady(true);

    // 检测是否从 localStorage 恢复
    const hasStoredData = localStorage.getItem(STORAGE_KEY) !== null;
    if (hasStoredData && store.nodeCount > 0) {
      addLog(`🔄 从本地存储恢复：${store.nodeCount} 个节点`, "#ff9800");
    } else {
      addLog("画布初始化完成", "#26c6da");
    }

    return () => {
      unsub();
      renderer.destroy();
    };
  }, [store]);

  // ─── 语音 Agent（mimo + Web Speech API）─────────────────────────

  const apiKey = import.meta.env.VITE_MIMO_API_KEY || "";
  const baseUrl = import.meta.env.VITE_MIMO_BASE_URL || "https://token-plan-cn.xiaomimimo.com/v1";
  const model = import.meta.env.VITE_MIMO_MODEL || "mimo-v2.5-pro";
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const {
    isListening,
    status: agentStatus,
    mode: agentMode,
    userTranscript,
    agentResponse,
    error: agentError,
    toggle: toggleVoice,
    stopTts: stopTtsPlayback,
    isSpeaking,
  } = useVoiceAgent({
    apiKey,
    baseUrl,
    model,
    store: storeReady ? store : null,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    onLog: addLog,
    enableTts: ttsEnabled,
  });

  return (
    <div style={styles.root}>
      {/* 交互式粒子背景 */}
      <AnimatedBackground />

      {/* 主内容（z-index 在背景之上） */}
      <div style={styles.content}>
        <h1 className="vdc-title vdc-fade-in">VDC — Voice-Driven Canvas</h1>

        <div style={styles.layout}>
          {/* 画布区域 */}
          <div style={styles.canvasWrapper} className="vdc-slide-up">
            <div className="vdc-canvas-container">
              <div ref={containerRef} style={styles.canvas} />
            </div>

            {/* 文本输入（已隐藏，仅使用语音控制） */}
          </div>

          {/* 状态面板 */}
          <div className="vdc-status-panel vdc-slide-up" style={{ animationDelay: "0.1s" }}>
            <h3 className="vdc-panel-title">实时状态</h3>

            <div className="vdc-stat-row">
              <span className="vdc-stat-label">节点数</span>
              <span className="vdc-stat-value">{nodeCount}</span>
            </div>
            <div className="vdc-stat-row">
              <span className="vdc-stat-label">背景色</span>
              <span className="vdc-stat-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: background,
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: `0 0 8px ${background}44`,
                  }}
                />
                {background}
              </span>
            </div>
            <div className="vdc-stat-row">
              <span className="vdc-stat-label">Undo 栈</span>
              <span className="vdc-stat-value">{undoDepth}</span>
            </div>
            <div className="vdc-stat-row">
              <span className="vdc-stat-label">语音状态</span>
              <span
                className="vdc-stat-value"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: isListening ? "#64ffda" : agentStatus === "thinking" ? "#b388ff" : agentStatus === "speaking" ? "#82b1ff" : agentStatus === "connecting" ? "#ffab40" : "rgba(150, 160, 200, 0.5)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: isListening ? "#64ffda" : agentStatus === "thinking" ? "#b388ff" : agentStatus === "speaking" ? "#82b1ff" : agentStatus === "connecting" ? "#ffab40" : "rgba(150, 160, 200, 0.3)",
                    boxShadow: isListening ? "0 0 8px #64ffda" : "none",
                  }}
                />
                {agentStatus === "listening"
                  ? "Listening"
                  : agentStatus === "thinking"
                    ? "Thinking..."
                    : agentStatus === "speaking"
                      ? "Speaking"
                      : agentStatus === "connected"
                        ? "Ready"
                        : agentStatus === "connecting"
                          ? "Connecting..."
                          : apiKey
                            ? "Off"
                            : "未配置"}
              </span>
            </div>

            <h3 className="vdc-panel-title" style={{ marginTop: 28 }}>操作日志</h3>
            <div className="vdc-log-container">
              {logs.filter(log => log.color !== '#F44336' && log.color !== '#ff4081').map((log, i) => (
                <div key={i} className="vdc-log-entry">
                  <span className="vdc-log-time">{log.time}</span>
                  <span style={{ color: log.color }}>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <span className="vdc-log-placeholder">等待事件...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 语音控制悬浮按钮（可选） */}
      {apiKey && (
        <VoiceButton
          status={agentStatus}
          mode={agentMode}
          isListening={isListening}
          error={agentError}
          userTranscript={userTranscript}
          agentResponse={agentResponse}
          onToggle={toggleVoice}
          isSpeaking={isSpeaking}
          onStopTts={stopTtsPlayback}
        />
      )}

      {/* TTS 开关 */}
      <div style={styles.ttsToggle}>
        <button
          onClick={() => setTtsEnabled((v) => !v)}
          className={`vdc-fab ${ttsEnabled ? "vdc-fab--active" : ""}`}
          title={ttsEnabled ? "关闭语音回复" : "开启语音回复"}
        >
          {ttsEnabled ? "🔊 TTS ON" : "🔇 TTS OFF"}
        </button>
      </div>

      {/* Import/Export 按钮 */}
      <div style={styles.ioButtons}>
        <button onClick={handleImport} className="vdc-fab" title="导入画布">
          📥 Import
        </button>
        <button onClick={handleExport} className="vdc-fab" title="导出画布">
          📤 Export
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".canvas,.json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─── 样式 ────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
  },
  content: {
    position: "relative",
    zIndex: 1,
    padding: "32px 40px",
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    color: "#e8eaf6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100vh",
  },
  layout: {
    display: "flex",
    gap: 28,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  canvasWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  canvas: {
    display: "block",
    background: "#fff",
  },
  inputWrapper: {
    width: 1000,
  },
  ioButtons: {
    position: "fixed" as const,
    bottom: 32,
    left: 32,
    display: "flex",
    gap: 10,
    zIndex: 9999,
  },
  ttsToggle: {
    position: "fixed" as const,
    bottom: 84,
    left: 32,
    display: "flex",
    gap: 10,
    zIndex: 9999,
  },
};
