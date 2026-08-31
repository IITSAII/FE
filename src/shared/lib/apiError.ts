/**
 * 서버/네트워크 에러를 화면에서 다루기 쉬운 형태로 정규화한 에러.
 * `message`는 그대로 사용자에게 보여줄 수 있는 문구다.
 */
export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
