/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /** 예: https://api.itsai.co.kr/api */
  readonly VITE_API_BASE_URL: string;
  /** GA4 측정 ID. 없으면 분석 이벤트를 보내지 않는다. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** 인화물 QR이 가리키는 사이트 주소. 없으면 프로덕션 빌드는 https://www.itsai.co.kr을 쓴다. */
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly TOSS_CLIENT_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
