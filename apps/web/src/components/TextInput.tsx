/**
 * TextInput — 文本指令输入降级模式
 *
 * 当语音不可用时，提供文本输入框让用户输入自然语言指令。
 * 使用简化的关键词匹配解析指令，调用 CanvasStore 方法。
 */

import { useState, useCallback } from "react";
import type { CanvasStore } from "@vdc/canvas-engine";
import type { Node } from "@vdc/shared";

interface TextInputProps {
  store: CanvasStore;
  onLog: (message: string, color?: string) => void;
}

// 颜色名 → 十六进制映射
const COLOR_MAP: Record<string, string> = {
  红色: "#F44336",
  蓝色: "#2196F3",
  绿色: "#4CAF50",
  黄色: "#FFEB3B",
  橙色: "#FF9800",
  紫色: "#9C27B0",
  黑色: "#000000",
  白色: "#FFFFFF",
  灰色: "#9E9E9E",
  浅蓝: "#E3F2FD",
  浅蓝色: "#E3F2FD",
  浅灰: "#F5F5F5",
  浅灰色: "#F5F5F5",
  深蓝: "#1565C0",
  深蓝色: "#1565C0",
  粉色: "#E91E63",
  粉红: "#E91E63",
  青色: "#00BCD4",
  棕色: "#795548",
};

let idCounter = 0;
function nextId(type: string): string {
  idCounter++;
  return `${type}-${Date.now()}-${idCounter}`;
}

/** 解析颜色文本 */
function parseColor(text: string): string | null {
  // 先查颜色名映射
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (text.includes(name)) return hex;
  }
  // 检查十六进制色值
  const hexMatch = text.match(/#[0-9a-fA-F]{3,8}/);
  if (hexMatch) return hexMatch[0];
  return null;
}

/** 简化指令解析器 */
function parseCommand(
  input: string,
  store: CanvasStore
): { tool: string; params: Record<string, unknown> } | null {
  const text = input.trim().toLowerCase();

  // 撤销
  if (text.includes("撤销") || text.includes("undo")) {
    const stepsMatch = text.match(/(\d+)/);
    return { tool: "undo_action", params: { steps: stepsMatch ? parseInt(stepsMatch[1]) : 1 } };
  }

  // 重做
  if (text.includes("重做") || text.includes("redo")) {
    const stepsMatch = text.match(/(\d+)/);
    return { tool: "redo_action", params: { steps: stepsMatch ? parseInt(stepsMatch[1]) : 1 } };
  }

  // 清空画布
  if (text.includes("清空") || text.includes("clear")) {
    return { tool: "clear_canvas", params: { confirm: true } };
  }

  // 设置背景
  if (text.includes("背景") || text.includes("background")) {
    const color = parseColor(text);
    if (color) return { tool: "set_canvas_background", params: { color } };
  }

  // 画矩形
  if (text.includes("矩形") || text.includes("rect") || text.includes("正方形") || text.includes("长方形")) {
    const color = parseColor(text) ?? "#2196F3";
    const isSquare = text.includes("正方形");
    return {
      tool: "generate_shape",
      params: {
        type: "rect",
        x: 400,
        y: 250,
        width: isSquare ? 150 : 200,
        height: 150,
        fill: color,
        stroke: "transparent",
        strokeWidth: 0,
        name: `矩形_${idCounter + 1}`,
      },
    };
  }

  // 画圆形
  if (text.includes("圆形") || text.includes("circle") || text.includes("圆")) {
    const color = parseColor(text) ?? "#4CAF50";
    return {
      tool: "generate_shape",
      params: {
        type: "circle",
        x: 500,
        y: 300,
        radius: 75,
        fill: color,
        stroke: "transparent",
        strokeWidth: 0,
        name: `圆形_${idCounter + 1}`,
      },
    };
  }

  // 画三角形
  if (text.includes("三角形") || text.includes("triangle")) {
    const color = parseColor(text) ?? "#FF9800";
    return {
      tool: "generate_shape",
      params: {
        type: "triangle",
        x: 500,
        y: 300,
        radius: 60,
        fill: color,
        stroke: "transparent",
        strokeWidth: 0,
        name: `三角形_${idCounter + 1}`,
      },
    };
  }

  // 画椭圆
  if (text.includes("椭圆") || text.includes("ellipse")) {
    const color = parseColor(text) ?? "#9C27B0";
    return {
      tool: "generate_shape",
      params: {
        type: "ellipse",
        x: 500,
        y: 300,
        width: 200,
        height: 120,
        fill: color,
        stroke: "transparent",
        strokeWidth: 0,
        name: `椭圆_${idCounter + 1}`,
      },
    };
  }

  // 画线条
  if (text.includes("线") || text.includes("line")) {
    return {
      tool: "generate_shape",
      params: {
        type: "line",
        x: 300,
        y: 300,
        width: 300,
        height: 0,
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 3,
        name: `线条_${idCounter + 1}`,
      },
    };
  }

  // 添加文本
  if (text.includes("文字") || text.includes("文本") || text.includes("text")) {
    const contentMatch = text.match(/["""「](.+?)["""」]/);
    const content = contentMatch ? contentMatch[1] : "示例文本";
    const color = parseColor(text) ?? "#000000";
    return {
      tool: "add_text",
      params: {
        text: content,
        x: 400,
        y: 300,
        fontSize: 24,
        fill: color,
        name: `文本_${idCounter + 1}`,
      },
    };
  }

  // 修改颜色（针对最近创建的节点）
  const nodes = store.getNodes();
  if (nodes.length > 0 && (text.includes("变") || text.includes("改") || text.includes("改成") || text.includes("颜色"))) {
    const color = parseColor(text);
    if (color) {
      const lastNode = nodes[nodes.length - 1];
      return {
        tool: "modify_node",
        params: {
          target: lastNode.id,
          updates: { fill: color },
        },
      };
    }
  }

  // 查询画布状态
  if (text.includes("查询") || text.includes("状态") || text.includes("query") || text.includes("有什么")) {
    return { tool: "query_canvas_state", params: {} };
  }

  return null;
}

/** 执行工具调用 */
function executeTool(
  tool: string,
  params: Record<string, unknown>,
  store: CanvasStore
): string {
  // 直接调用 store 方法，与 voice-agent/tools.ts 保持一致
  switch (tool) {
    case "set_canvas_background":
      return JSON.stringify(store.setBackground(params.color as string));

    case "generate_shape": {
      const node: Node = {
        id: nextId(params.type as string),
        type: params.type as Node["type"],
        x: params.x as number,
        y: params.y as number,
        width: params.width as number | undefined,
        height: params.height as number | undefined,
        radius: params.radius as number | undefined,
        rotation: (params.rotation as number) ?? 0,
        fill: (params.fill as string) ?? "#000000",
        stroke: (params.stroke as string) ?? "transparent",
        strokeWidth: (params.strokeWidth as number) ?? 0,
        opacity: (params.opacity as number) ?? 1,
        zIndex: store.nodeCount,
        locked: false,
        visible: true,
        scaleX: 1,
        scaleY: 1,
        children: [],
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "mouse",
          name: params.name as string | undefined,
        },
      };
      return JSON.stringify(store.addNode(node));
    }

    case "modify_node":
      return JSON.stringify(
        store.updateNode(params.target as string, params.updates as Partial<Node>)
      );

    case "delete_node":
      return JSON.stringify(
        store.deleteNode(params.target as string, (params.cascade as boolean) ?? false)
      );

    case "undo_action": {
      const steps = (params.steps as number) ?? 1;
      return JSON.stringify(steps === 1 ? store.undo() : store.undoSteps(steps));
    }

    case "redo_action": {
      const steps = (params.steps as number) ?? 1;
      return JSON.stringify(steps === 1 ? store.redo() : store.redoSteps(steps));
    }

    case "clear_canvas":
      return JSON.stringify(store.clearCanvas((params.confirm as boolean) ?? false));

    case "add_text": {
      const textNode: Node = {
        id: nextId("text"),
        type: "text",
        x: params.x as number,
        y: params.y as number,
        rotation: 0,
        fill: (params.fill as string) ?? "#000000",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 1,
        text: params.text as string,
        fontSize: (params.fontSize as number) ?? 16,
        fontFamily: (params.fontFamily as string) ?? "Arial",
        zIndex: store.nodeCount,
        locked: false,
        visible: true,
        scaleX: 1,
        scaleY: 1,
        children: [],
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "mouse",
          name: params.name as string | undefined,
        },
      };
      return JSON.stringify(store.addNode(textNode));
    }

    case "query_canvas_state": {
      const nodes = store.getNodes();
      return JSON.stringify({
        nodeCount: store.nodeCount,
        edgeCount: store.edgeCount,
        background: store.getBackground(),
        undoDepth: store.undoDepth,
        redoDepth: store.redoDepth,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          name: n.metadata.name,
          x: Math.round(n.x),
          y: Math.round(n.y),
          fill: n.fill,
        })),
      });
    }

    default:
      return JSON.stringify({ success: false, errorMessage: `未知工具: ${tool}` });
  }
}

export function TextInput({ store, onLog }: TextInputProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // 记录历史
    setHistory((prev) => [trimmed, ...prev].slice(0, 50));
    setHistoryIndex(-1);

    // 解析指令
    const parsed = parseCommand(trimmed, store);
    if (!parsed) {
      onLog(`❓ 无法解析指令: "${trimmed}"`, "#FF9800");
      onLog('  💡 试试: 画一个红色矩形 / 背景改成浅蓝色 / 撤销 / 查询状态', "#888");
      setInput("");
      return;
    }

    // 执行工具
    try {
      const resultStr = executeTool(parsed.tool, parsed.params, store);
      const result = JSON.parse(resultStr);

      if (result.success) {
        onLog(`✅ ${parsed.tool} → ${result.message ?? "成功"}`, "#4CAF50");
      } else {
        onLog(`❌ ${parsed.tool} → ${result.errorMessage ?? "失败"}`, "#F44336");
      }
    } catch (err) {
      onLog(`💥 执行异常: ${err instanceof Error ? err.message : "未知错误"}`, "#F44336");
    }

    setInput("");
  }, [input, store, onLog]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = Math.min(historyIndex + 1, history.length - 1);
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        } else {
          setHistoryIndex(-1);
          setInput("");
        }
      }
    },
    [handleSubmit, history, historyIndex]
  );

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='输入指令，如 "画一个红色矩形"、"背景改成浅蓝色"、"撤销"'
        style={styles.input}
      />
      <button onClick={handleSubmit} style={styles.button}>
        发送
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    background: "#16213e",
    borderRadius: 8,
    border: "1px solid #333",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #444",
    background: "#0f3460",
    color: "#eee",
    fontSize: 14,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    outline: "none",
  },
  button: {
    padding: "8px 20px",
    borderRadius: 6,
    border: "none",
    background: "#2196F3",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
