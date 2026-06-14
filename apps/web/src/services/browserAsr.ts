/**
 * Browser ASR Service — 基于 Web Speech API 的语音识别
 *
 * 使用浏览器原生 SpeechRecognition API，无需外部 API。
 * 支持连续识别和中间结果（interimResults）。
 *
 * 兼容性：Chrome 33+, Edge 79+, Safari 14.1+
 * 注意：Firefox 不支持 Web Speech API，会降级到文本模式
 */

// ─── 类型 ────────────────────────────────────────────────────

export interface AsrCallbacks {
  /** 收到识别结果（isFinal=true 时为最终结果） */
  onResult: (text: string, isFinal: boolean) => void;
  /** 识别出错 */
  onError: (error: string) => void;
  /** 状态变更 */
  onStateChange: (state: "listening" | "stopped") => void;
}

// ─── 内部状态 ─────────────────────────────────────────────────

let recognition: any = null; // SpeechRecognition 实例
let isListening = false;

/**
 * 检查浏览器是否支持 Web Speech API
 */
export function isAsrSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * 开始语音识别
 *
 * @param callbacks  回调函数
 * @param lang       识别语言（默认中文）
 */
export function startAsr(
  callbacks: AsrCallbacks,
  lang: string = "zh-CN"
): void {
  if (isListening) return;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError("当前浏览器不支持语音识别，请使用 Chrome 或 Edge");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = true;         // 持续识别
  recognition.interimResults = true;     // 返回中间结果
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onResult(finalTranscript, true);
    } else if (interimTranscript) {
      callbacks.onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    // "no-speech" 不算真正错误，忽略
    if (event.error === "no-speech") return;

    const errorMap: Record<string, string> = {
      "not-allowed": "麦克风权限被拒绝，请在浏览器设置中允许",
      "audio-capture": "未检测到麦克风设备",
      "network": "语音识别网络错误",
      "aborted": "语音识别被中断",
    };

    callbacks.onError(errorMap[event.error] ?? `语音识别错误: ${event.error}`);
  };

  recognition.onend = () => {
    // 如果还在监听状态但识别停止了，自动重启（浏览器有时会自动停止）
    if (isListening) {
      try {
        recognition.start();
      } catch {
        // 忽略重复 start 错误
      }
    } else {
      callbacks.onStateChange("stopped");
    }
  };

  recognition.onstart = () => {
    callbacks.onStateChange("listening");
  };

  try {
    recognition.start();
    isListening = true;
  } catch (err) {
    callbacks.onError("启动语音识别失败");
  }
}

/**
 * 停止语音识别
 */
export function stopAsr(): void {
  isListening = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // 忽略停止错误
    }
    recognition = null;
  }
}

/**
 * 是否正在监听
 */
export function isAsrListening(): boolean {
  return isListening;
}
