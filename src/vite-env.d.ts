/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /** 예: https://api.itsai.co.kr/api */
  readonly VITE_API_BASE_URL: string;
  /** 촬영 전 스태프 인증 코드(6자리 숫자). 미설정 시 인증이 불가하다. */
  readonly VITE_PAYMENT_AUTH_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
