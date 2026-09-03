import { useEffect, useState } from "react";
import { getSessionStatus, type SessionStatusResponse } from "../../features/payment/api/paymentApi";
import { isApiError } from "../lib/apiError";

const POLL_INTERVAL_MS = 5000;

/**
 * `GET /api/sessions/{sessionId}/status`를 진입 시 1회 + 주기적으로 폴링해
 * 현재 단계의 `stepExpiresAt`을 서버와 동기화한다. 실제 초 단위 카운트다운 표시는
 * `useCountdown`이 이 값을 받아 로컬에서 처리한다.
 */
export function useStepExpiry(sessionId: string | null | undefined) {
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchStatus() {
      try {
        const data = await getSessionStatus(sessionId as string, controller.signal);
        if (isMounted) {
          setStatus(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (isApiError(err) && err.code === "CANCELED") return;
        console.error("세션 상태 조회 실패:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [sessionId]);

  return { status, isLoading };
}
