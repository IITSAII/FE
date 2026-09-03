import { api } from "../../../shared/lib/axios";

export type SessionStep =
  | "QUANTITY"
  | "PAYMENT"
  | "RELATIONSHIP"
  | "CAPTURE"
  | "SELECT"
  | "FRAME"
  | "PRINT"
  | "DONE";

export type SessionStatus =
  | "CREATED"
  | "PAID"
  | "IN_PROGRESS"
  | "DONE"
  | "EXPIRED";

/** `POST /api/sessions` 응답 (`SessionCreateResponse`). */
export interface SessionCreateResponse {
  /** 세션 공개 식별자. 토스페이먼츠 orderId로도 그대로 사용한다. */
  sessionId: string;
  /** 서버가 quantity 기준으로 계산해 확정한 결제 금액(원). */
  amount: number;
  currentStep: SessionStep;
}

/** `SessionStatusResponse`. 결제 승인 응답으로도 내려온다. */
export interface SessionStatusResponse {
  sessionId: string;
  status: SessionStatus;
  currentStep: SessionStep;
  /** 현재 단계의 타임아웃 시각. 설정되지 않은 단계면 null. */
  stepExpiresAt: string | null;
}

/**
 * 세션 생성. 금액은 클라이언트가 보내지 않고 서버가 quantity로 계산해 확정한다.
 * 허용 quantity: 2, 4, 6
 */
export async function createSession(
  quantity: number,
  signal?: AbortSignal,
): Promise<SessionCreateResponse> {
  const { data } = await api.post<SessionCreateResponse>(
    "/sessions",
    { quantity },
    { signal },
  );
  return data;
}

/**
 * 결제 승인. orderId는 보내지 않는다 — 서버가 경로의 sessionId를 orderId로 사용한다.
 * amount가 서버가 아는 세션 금액과 다르면 토스 호출 없이 거부된다.
 */
export async function confirmPayment(
  sessionId: string,
  params: { paymentKey: string; amount: number },
  signal?: AbortSignal,
): Promise<SessionStatusResponse> {
  const { data } = await api.post<SessionStatusResponse>(
    `/sessions/${sessionId}/payment/confirm`,
    params,
    { signal },
  );
  return data;
}

/**
 * 세션 상태 조회. 현재 단계와 그 단계의 만료 시각(`stepExpiresAt`)을 반환한다.
 * 실제 타이머 동기화의 유일한 근거로 사용된다.
 */
export async function getSessionStatus(
  sessionId: string,
  signal?: AbortSignal,
): Promise<SessionStatusResponse> {
  const { data } = await api.get<SessionStatusResponse>(
    `/sessions/${sessionId}/status`,
    { signal },
  );
  return data;
}
