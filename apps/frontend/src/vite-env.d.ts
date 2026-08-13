/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Active le mode démonstration (MSW) au lieu du backend réel. */
  readonly VITE_USE_MOCKS: string;
  /** URL de base de l'API backend (mode connecté). */
  readonly VITE_API_BASE_URL: string;
  /** URL du namespace WebSocket du module generation. */
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
