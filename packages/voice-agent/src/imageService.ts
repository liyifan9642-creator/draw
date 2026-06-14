/**
 * Image Generation Service — AI 图像生成（手绘风格）
 *
 * 使用 Pollinations.ai 免费 API，通过 Prompt Engineering
 * 将所有生成的图片约束为"白底黑线简笔画"风格。
 *
 * 前端渲染时配合 multiply 混合模式，自动过滤白色背景，
 * 只保留黑色线条，与 Rough.js 几何图形形成统一的涂鸦风格。
 */

/** 图像风格枚举 */
export type ImageStyle =
  | "realistic"
  | "cartoon"
  | "oil_painting"
  | "watercolor"
  | "pixel_art"
  | "sketch"
  | "cyberpunk"
  | "anime";

/** 图像生成请求参数 */
export interface ImageGenerationRequest {
  /** 图像描述（英文效果更好） */
  prompt: string;
  /** 风格 */
  style?: ImageStyle;
  /** 图像宽度 */
  width?: number;
  /** 图像高度 */
  height?: number;
}

/** 图像生成结果 */
export interface ImageGenerationResult {
  /** 是否成功 */
  success: boolean;
  /** 图像 URL（成功时） */
  imageUrl?: string;
  /** 错误信息（失败时） */
  error?: string;
}

/**
 * 强制风格后缀 — 所有生成的图片都追加此约束
 *
 * 设计目的：
 * 1. 统一视觉风格为"白板涂鸦"
 * 2. 白色背景 + multiply 混合模式 = 自动去背
 * 3. 黑色线条保留，与 Rough.js 几何图形风格一致
 */
const STYLE_SUFFIX = ", doodle style sketch, black and white line art, white background, high contrast, simple clean lines, coloring book page style";

/**
 * 生成图像
 *
 * 使用 Pollinations.ai 免费 API，在 prompt 末尾强制拼接风格后缀，
 * 确保所有生成的图片都是"白底黑线简笔画"风格。
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  try {
    // 构建 prompt：用户描述 + 强制风格后缀
    const fullPrompt = request.prompt + STYLE_SUFFIX;

    // Pollinations.ai API — 免费 AI 图像生成
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const seed = hashString(request.prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=512`;

    // 预加载图片（等待生成完成）
    await preloadImage(imageUrl);

    return {
      success: true,
      imageUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "图像生成失败",
    };
  }
}

/** 预加载图片，确保 URL 可访问 */
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = url;
    // 超时处理（30秒）
    setTimeout(() => reject(new Error("图像生成超时")), 30000);
  });
}

/** 简单字符串哈希（用于生成稳定的 seed） */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
