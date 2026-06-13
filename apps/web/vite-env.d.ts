/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ElevenLabs Conversational AI Agent ID */
  readonly VITE_ELEVENLABS_AGENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
