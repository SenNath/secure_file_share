/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_FILE_CHUNK_SIZE: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ENABLE_MFA: string
  readonly VITE_ENABLE_FILE_ENCRYPTION: string
  readonly VITE_ENCRYPTION_ALGORITHM: string
  readonly VITE_KEY_LENGTH: string
  readonly VITE_IV_LENGTH: string
  readonly VITE_AUTH_TOKEN_KEY: string
  readonly VITE_REFRESH_TOKEN_KEY: string
  readonly VITE_DEV_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 