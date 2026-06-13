/**
 * TextInput — 文本指令输入降级模式
 *
 * 当语音不可用时，提供文本输入框让用户输入自然语言指令。
 * 使用简化的关键词匹配解析指令，调用 CanvasStore 方法。
 */

import { useState, useCallback } from "react";
import type { CanvasStore } from "@vdc/canvas-engine";
import type { Node } from "@vdc/shared";
import { resolvePosition, setCanvasSize, generateImage } from "@vdc/voice-agent";
import type { SpatialPosition, ImageStyle } from "@vdc/voice-agent";

interface TextInputProps {
  store: CanvasStore;
  canvasWidth: number;
  canvasHeight: number;
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

/** 从文本中解析空间方位 */
function parsePosition(text: string): SpatialPosition | null {
  if (text.includes("左上") || text.includes("左上角") || text.includes("top-left")) return "top-left";
  if (text.includes("右上") || text.includes("右上角") || text.includes("top-right")) return "top-right";
  if (text.includes("左下") || text.includes("左下角") || text.includes("bottom-left")) return "bottom-left";
  if (text.includes("右下") || text.includes("右下角") || text.includes("bottom-right")) return "bottom-right";
  if (text.includes("中间") || text.includes("中央") || text.includes("居中") || text.includes("center")) return "center";
  return null;
}

/** 从文本中解析图像风格 */
function parseImageStyle(text: string): ImageStyle {
  if (text.includes("赛博朋克") || text.includes("cyberpunk")) return "cyberpunk";
  if (text.includes("卡通") || text.includes("cartoon")) return "cartoon";
  if (text.includes("油画") || text.includes("oil")) return "oil_painting";
  if (text.includes("水彩") || text.includes("watercolor")) return "watercolor";
  if (text.includes("像素") || text.includes("pixel")) return "pixel_art";
  if (text.includes("素描") || text.includes("sketch")) return "sketch";
  if (text.includes("动漫") || text.includes("anime")) return "anime";
  return "realistic";
}

/** 从文本中提取图像描述（prompt） */
function extractImagePrompt(text: string): string {
  // 移除位置和风格关键词，提取核心描述
  let prompt = text
    .replace(/生成|创建|画|生成一张|一张/g, "")
    .replace(/图片|图像|照片/g, "")
    .replace(/赛博朋克|cyberpunk|卡通|cartoon|油画|oil|水彩|watercolor|像素|pixel|素描|sketch|动漫|anime|风格的/g, "")
    .replace(/左上角|右上角|左下角|右下角|中间|中央|居中/g, "")
    .replace(/的/g, "")
    .trim();

  // 如果清理后为空，返回默认描述
  return prompt || "可爱的猫咪";
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
    const position = parsePosition(text);
    const baseParams: Record<string, unknown> = {
      type: "rect",
      width: isSquare ? 150 : 200,
      height: 150,
      fill: color,
      stroke: "transparent",
      strokeWidth: 0,
      name: `矩形_${idCounter + 1}`,
    };
    if (position) {
      baseParams.position = position;
    } else {
      baseParams.x = 400;
      baseParams.y = 250;
    }
    return { tool: "generate_shape", params: baseParams };
  }

  // 画圆形
  if (text.includes("圆形") || text.includes("circle") || text.includes("圆")) {
    const color = parseColor(text) ?? "#4CAF50";
    const position = parsePosition(text);
    const baseParams: Record<string, unknown> = {
      type: "circle",
      radius: 75,
      fill: color,
      stroke: "transparent",
      strokeWidth: 0,
      name: `圆形_${idCounter + 1}`,
    };
    if (position) {
      baseParams.position = position;
    } else {
      baseParams.x = 500;
      baseParams.y = 300;
    }
    return { tool: "generate_shape", params: baseParams };
  }

  // 画三角形
  if (text.includes("三角形") || text.includes("triangle")) {
    const color = parseColor(text) ?? "#FF9800";
    const position = parsePosition(text);
    const baseParams: Record<string, unknown> = {
      type: "triangle",
      radius: 60,
      fill: color,
      stroke: "transparent",
      strokeWidth: 0,
      name: `三角形_${idCounter + 1}`,
    };
    if (position) {
      baseParams.position = position;
    } else {
      baseParams.x = 500;
      baseParams.y = 300;
    }
    return { tool: "generate_shape", params: baseParams };
  }

  // 画椭圆
  if (text.includes("椭圆") || text.includes("ellipse")) {
    const color = parseColor(text) ?? "#9C27B0";
    const position = parsePosition(text);
    const baseParams: Record<string, unknown> = {
      type: "ellipse",
      width: 200,
      height: 120,
      fill: color,
      stroke: "transparent",
      strokeWidth: 0,
      name: `椭圆_${idCounter + 1}`,
    };
    if (position) {
      baseParams.position = position;
    } else {
      baseParams.x = 500;
      baseParams.y = 300;
    }
    return { tool: "generate_shape", params: baseParams };
  }

  // 画线条
  if (text.includes("线") || text.includes("line")) {
    const position = parsePosition(text);
    const baseParams: Record<string, unknown> = {
      type: "line",
      width: 300,
      height: 0,
      fill: "#000000",
      stroke: "#000000",
      strokeWidth: 3,
      name: `线条_${idCounter + 1}`,
    };
    if (position) {
      baseParams.position = position;
    } else {
      baseParams.x = 300;
      baseParams.y = 300;
    }
    return { tool: "generate_shape", params: baseParams };
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

  // 生成图像
  if (text.includes("图片") || text.includes("图像") || text.includes("生成") || text.includes("image")) {
    const prompt = extractImagePrompt(text);
    const style = parseImageStyle(text);
    const position = parsePosition(text);

    return {
      tool: "generate_image",
      params: {
        prompt,
        style,
        position: position ?? "center",
        width: 300,
        height: 300,
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
      // 计算图形尺寸
      const nodeWidth = (params.width as number) ?? ((params.radius as number) ? (params.radius as number) * 2 : 100);
      const nodeHeight = (params.height as number) ?? ((params.radius as number) ? (params.radius as number) * 2 : 100);

      // 如果有 position 参数，解析为像素坐标
      let x: number;
      let y: number;
      if (params.position) {
        const resolved = resolvePosition(params.position as SpatialPosition, nodeWidth, nodeHeight);
        x = resolved.x;
        y = resolved.y;
      } else {
        x = params.x as number;
        y = params.y as number;
      }

      const node: Node = {
        id: nextId(params.type as string),
        type: params.type as Node["type"],
        x,
        y,
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

    case "generate_image": {
      const id = nextId("image");
      const imgWidth = (params.width as number) ?? 300;
      const imgHeight = (params.height as number) ?? 300;

      // 解析坐标
      let x: number;
      let y: number;
      if (params.position) {
        const resolved = resolvePosition(params.position as SpatialPosition, imgWidth, imgHeight);
        x = resolved.x;
        y = resolved.y;
      } else {
        const resolved = resolvePosition("center", imgWidth, imgHeight);
        x = resolved.x;
        y = resolved.y;
      }

      // 1. 插入占位文本节点（"Loading..."）
      const placeholderNode: Node = {
        id,
        type: "text",
        x,
        y,
        rotation: 0,
        fill: "#9E9E9E",
        stroke: "transparent",
        strokeWidth: 0,
        opacity: 0.8,
        text: `⏳ 正在生成: ${params.prompt}`,
        fontSize: 14,
        fontFamily: "Arial",
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
          name: `图像_${(params.prompt as string).slice(0, 10)}`,
        },
      };

      const addResult = store.addNode(placeholderNode);

      // 2. 异步调用图像生成 API
      generateImage({
        prompt: params.prompt as string,
        style: params.style as ImageStyle,
        width: imgWidth,
        height: imgHeight,
      }).then((result) => {
        if (result.success && result.imageUrl) {
          // 3a. 成功：将占位节点替换为图像节点
          store.updateNode(id, {
            type: "image",
            imageUrl: result.imageUrl,
            text: undefined,
            width: imgWidth,
            height: imgHeight,
            fill: "transparent",
            opacity: 1,
          });
        } else {
          // 3b. 失败：更新占位节点显示错误信息
          store.updateNode(id, {
            text: `❌ 生成失败: ${result.error ?? "未知错误"}`,
            fill: "#F44336",
          });
        }
      });

      return JSON.stringify({
        ...addResult,
        message: `正在生成图像: "${params.prompt}"，请稍候...`,
      });
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

export function TextInput({ store, canvasWidth, canvasHeight, onLog }: TextInputProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 同步画布尺寸到工具上下文
  useState(() => {
    setCanvasSize(canvasWidth, canvasHeight);
  });

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
      onLog('  💡 试试: 在左上角画一个红色矩形 / 在右下角生成一张赛博朋克风格的猫的图片 / 背景改成浅蓝色 / 撤销', "#888");
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
        placeholder='输入指令，如 "在右下角生成一张赛博朋克风格的猫的图片"、"画一个红色矩形"、"撤销"'
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
