/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /** 예: https://api.itsai.co.kr/api */
  readonly VITE_API_BASE_URL: string;
  readonly TOSS_CLIENT_KEY: string;
  /** Naver Cloud Platform Maps API Client ID. 없으면 지도 대신 외부 링크로 대체된다. */
  readonly VITE_NAVER_MAP_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
