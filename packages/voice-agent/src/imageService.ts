/**
 * Image Generation Service
 *
 * 提供图像生成能力。当前使用 picsum.photos 作为占位 API（免鉴权）。
 * 未来可替换为 Fal.ai / DALL·E 等真实 API。
 *
 * 设计原则：
 * - 纯前端可调用，无需后端代理
 * - 返回 Promise<string>（图像 URL）
 * - 支持 style 参数（当前占位 API 忽略 style，仅返回随机图片）
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
  /** 图像描述 */
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
 * 生成图像
 *
 * 当前实现：使用 picsum.photos 返回随机占位图片
 * 延迟 1.5-2.5 秒模拟真实 API 调用耗时
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  const width = request.width ?? 300;
  const height = request.height ?? 300;

  try {
    // 使用 picsum.photos 作为占位 API（免鉴权，返回随机图片）
    // seed 基于 prompt 的 hash，确保相同 prompt 返回相同图片
    const seed = hashString(request.prompt);
    const imageUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;

    // 模拟网络延迟（1.5-2.5 秒）
    const delay = 1500 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 验证图片可访问（预加载）
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
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    img.src = url;
  });
}

/** 简单字符串哈希（用于生成稳定的 seed） */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 转换为 32 位整数
  }
  return Math.abs(hash).toString(36);
}
