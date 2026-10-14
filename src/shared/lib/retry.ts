import { isApiError } from "./apiError";

/** 일시적인 네트워크/서버 문제로 볼 수 있어 재시도할 만한 에러인지 판단한다. */
export function isRetryableError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  if (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR") return true;
  return error.status != null && error.status >= 500;
}

interface RetryOptions {
  /** 첫 시도 이후 추가로 재시도할 횟수. */
  retries?: number;
  /** 재시도 사이 대기 시간(ms). 시도할 때마다 배수로 늘어난다. */
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/** `fn`이 재시도 가능한 에러로 실패하면 지정한 횟수만큼 다시 시도한다. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, delayMs = 1000, shouldRetry = isRetryableError }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * (attempt + 1)),
      );
    }
  }
}
