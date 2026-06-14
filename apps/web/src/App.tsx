/**
 * VDC Dev Sandbox — Konva 渲染层 + 文本/语音控制
 *
 * 控制模式：
 *   文本模式：在输入框中输入自然语言指令，回车或点击发送
 *   语音模式：点击右下角悬浮按钮开启语音监听（需配置 VITE_ELEVENLABS_AGENT_ID）
 */

import { useEffect, useRef, useState } from "react";
import { CanvasStore, KonvaRenderer } from "@vdc/canvas-engine";
import { useVoiceAgent } from "./hooks/useVoiceAgent";
import { setCanvasSize } from "@vdc/voice-agent";
import { VoiceButton } from "./components/VoiceButton";
import { TextInput } from "./components/TextInput";

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

    addLog("📤 画布已导出为 drawing.canvas", "#2196F3");
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
          addLog(`📥 ${result.message}`, "#4CAF50");
        } else {
          addLog(`❌ 导入失败: ${result.errorMessage}`, "#F44336");
        }
      } catch (err) {
        addLog(`❌ 文件解析失败: ${err instanceof Error ? err.message : "未知错误"}`, "#F44336");
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
      addLog(`🔄 从本地存储恢复：${store.nodeCount} 个节点`, "#FF9800");
    } else {
      addLog("画布初始化完成", "#2196F3");
    }

    return () => {
      unsub();
      renderer.destroy();
    };
  }, [store]);

  // ─── 语音 Agent（可选）────────────────────────────────────────

  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "";

  const {
    isListening,
    status: agentStatus,
    mode: agentMode,
    userTranscript,
    agentResponse,
    error: agentError,
    toggle: toggleVoice,
  } = useVoiceAgent({
    agentId,
    store: storeReady ? store : null,
  });

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>VDC — Voice-Driven Canvas</h1>

      <div style={styles.layout}>
        {/* 画布区域 */}
        <div style={styles.canvasWrapper}>
          <div ref={containerRef} style={styles.canvas} />

          {/* 文本输入 */}
          <div style={styles.inputWrapper}>
            <TextInput store={store} canvasWidth={CANVAS_WIDTH} canvasHeight={CANVAS_HEIGHT} onLog={addLog} />
          </div>
        </div>

        {/* 状态面板 */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>实时状态</h3>
          <div style={styles.stat}>
            <span>节点数:</span>
            <span style={styles.statValue}>{nodeCount}</span>
          </div>
          <div style={styles.stat}>
            <span>背景色:</span>
            <span style={{ ...styles.statValue, color: background }}>
              {background}
            </span>
          </div>
          <div style={styles.stat}>
            <span>Undo 栈:</span>
            <span style={styles.statValue}>{undoDepth}</span>
          </div>
          <div style={styles.stat}>
            <span>语音状态:</span>
            <span
              style={{
                ...styles.statValue,
                color: isListening ? "#4CAF50" : "#9E9E9E",
              }}
            >
              {agentStatus === "connected"
                ? agentMode === "listening"
                  ? "Listening"
                  : "Speaking"
                : agentStatus === "connecting"
                  ? "Connecting..."
                  : agentId
                    ? "Off"
                    : "未配置"}
            </span>
          </div>

          <h3 style={{ ...styles.panelTitle, marginTop: 24 }}>操作日志</h3>
          <div style={styles.logContainer}>
            {logs.map((log, i) => (
              <div key={i} style={styles.logEntry}>
                <span style={styles.logTime}>{log.time}</span>
                <span style={{ color: log.color }}>{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <span style={styles.logPlaceholder}>等待事件...</span>
            )}
          </div>
        </div>
      </div>

      {/* 语音控制悬浮按钮（可选） */}
      {agentId && (
        <VoiceButton
          status={agentStatus}
          mode={agentMode}
          isListening={isListening}
          error={agentError}
          userTranscript={userTranscript}
          agentResponse={agentResponse}
          onToggle={toggleVoice}
        />
      )}

      {/* Import/Export 按钮 */}
      <div style={styles.ioButtons}>
        <button onClick={handleImport} style={styles.ioButton} title="导入画布">
          📥 Import
        </button>
        <button onClick={handleExport} style={styles.ioButton} title="导出画布">
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
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    background: "#1a1a2e",
    color: "#eee",
    minHeight: "100vh",
    padding: "24px 32px",
  },
  title: {
    margin: "0 0 20px",
    fontSize: 22,
    fontWeight: 600,
    color: "#90CAF9",
  },
  layout: {
    display: "flex",
    gap: 24,
    alignItems: "flex-start",
  },
  canvasWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  canvas: {
    border: "2px solid #333",
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
    background: "#fff",
  },
  inputWrapper: {
    width: 1000,
  },
  panel: {
    background: "#16213e",
    borderRadius: 8,
    padding: "16px 20px",
    minWidth: 320,
    border: "1px solid #333",
  },
  panelTitle: {
    margin: "0 0 12px",
    fontSize: 14,
    fontWeight: 600,
    color: "#64B5F6",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  stat: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
  },
  statValue: {
    fontWeight: 700,
    fontFamily: "monospace",
  },
  logContainer: {
    maxHeight: 300,
    overflowY: "auto" as const,
  },
  logEntry: {
    display: "flex",
    gap: 12,
    marginBottom: 6,
    fontSize: 13,
    fontFamily: "monospace",
  },
  logTime: {
    color: "#666",
    flexShrink: 0,
  },
  logPlaceholder: {
    color: "#555",
    fontStyle: "italic",
    fontSize: 13,
  },
  ioButtons: {
    position: "fixed" as const,
    bottom: 32,
    left: 32,
    display: "flex",
    gap: 8,
    zIndex: 9999,
  },
  ioButton: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #444",
    background: "#16213e",
    color: "#eee",
    fontSize: 13,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
