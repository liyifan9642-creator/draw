/**
 * Browser TTS Service — 基于 Web Speech API 的语音合成
 *
 * 使用浏览器原生 SpeechSynthesis API，无需外部 API。
 * 支持中文语音、语速/音调调节。
 *
 * 兼容性：所有现代浏览器
 */

// ─── 类型 ────────────────────────────────────────────────────

export interface TtsCallbacks {
  /** 开始播放 */
  onStart?: () => void;
  /** 播放结束 */
  onEnd?: () => void;
  /** 播放出错 */
  onError?: (error: string) => void;
}

// ─── 内部状态 ─────────────────────────────────────────────────

let isSpeaking = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * 检查浏览器是否支持 TTS
 */
export function isTtsSupported(): boolean {
  return !!window.speechSynthesis;
}

/**
 * 播放文本为语音
 *
 * @param text      要播放的文本
 * @param callbacks 回调函数
 * @param options   配置选项
 */
export function speak(
  text: string,
  callbacks?: TtsCallbacks,
  options?: {
    lang?: string;
    rate?: number;    // 语速 0.1-10，默认 1
    pitch?: number;   // 音调 0-2，默认 1
    volume?: number;  // 音量 0-1，默认 1
  }
): void {
  if (!window.speechSynthesis) {
    callbacks?.onError?.("当前浏览器不支持语音合成");
    return;
  }

  // 先取消之前的播放
  stop();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options?.lang ?? "zh-CN";
  utterance.rate = options?.rate ?? 1;
  utterance.pitch = options?.pitch ?? 1;
  utterance.volume = options?.volume ?? 1;

  // 尝试选择中文语音
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(
    (v) => v.lang.startsWith("zh") || v.lang.startsWith("cmn")
  );
  if (zhVoice) {
    utterance.voice = zhVoice;
  }

  utterance.onstart = () => {
    isSpeaking = true;
    callbacks?.onStart?.();
  };

  utterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    callbacks?.onEnd?.();
  };

  utterance.onerror = (event) => {
    isSpeaking = false;
    currentUtterance = null;
    // "interrupted" 和 "canceled" 不算真正错误
    if (event.error !== "interrupted" && event.error !== "canceled") {
      callbacks?.onError?.(`语音合成错误: ${event.error}`);
    }
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/**
 * 停止当前播放
 */
export function stop(): void {
  isSpeaking = false;
  currentUtterance = null;
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 是否正在播放
 */
export function isTtsPlaying(): boolean {
  return isSpeaking;
}

/**
 * 预加载语音列表（某些浏览器需要在用户交互后才能获取）
 */
export function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    // 超时兜底
    setTimeout(() => resolve([]), 2000);
  });
}
