/**
 * 백엔드 공통 응답 포맷 (`global/common/CommonResponse`).
 * 모든 API는 성공/실패와 무관하게 이 형태로 감싸서 내려준다.
 */
export interface CommonResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorDetail | null;
}

/** 실패 응답에 담기는 에러 상세 (`CommonResponse.ErrorDetail`). */
export interface ApiErrorDetail {
  code: string;
  message: string;
}
