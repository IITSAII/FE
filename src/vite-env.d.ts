/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /** 예: https://api.itsai.co.kr/api */
  readonly VITE_API_BASE_URL: string;
  /** GA4 측정 ID. 없으면 분석 이벤트를 보내지 않는다. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly TOSS_CLIENT_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
