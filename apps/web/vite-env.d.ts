/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** mimo API Key */
  readonly VITE_MIMO_API_KEY: string;
  /** mimo API Base URL（默认 https://token-plan-cn.xiaomimimo.com/v1） */
  readonly VITE_MIMO_BASE_URL?: string;
  /** mimo LLM 模型名（默认 mimo-v2.5-pro） */
  readonly VITE_MIMO_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
