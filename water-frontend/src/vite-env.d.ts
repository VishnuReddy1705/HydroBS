/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the HydroBS backend API (e.g. https://api.hydrobs.com). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
