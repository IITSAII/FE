/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /** 예: https://api.itsai.co.kr/api */
  readonly VITE_API_BASE_URL: string;
  /** 촬영 전 스태프 인증 코드(6자리 숫자). 미설정 시 인증이 불가하다. */
  readonly VITE_PAYMENT_AUTH_CODE?: string;
  /** 인화물 QR이 가리키는 사이트 주소. 없으면 프로덕션 빌드는 https://www.itsai.co.kr을 쓴다. */
  readonly VITE_PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
