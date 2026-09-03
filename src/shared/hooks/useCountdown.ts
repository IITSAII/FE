import { useEffect, useRef, useState } from "react";

export interface UseCountdownOptions {
  /** 서버 기준 만료 시각(ISO 문자열). 주어지면 이 값을 기준으로 잔여 초를 계산한다. */
  expiresAt?: string | null;
  /** `expiresAt`이 없을 때 사용할 고정 카운트다운 초(예: 세션 생성 전 QuantityStep). */
  durationSeconds?: number;
  /** 카운트다운이 0에 도달했을 때 정확히 한 번 호출된다. */
  onExpire?: () => void;
  /** false면 카운트다운을 진행하지 않는다(초기 데이터 로딩 중 등). */
  enabled?: boolean;
}

function secondsUntil(targetMs: number): number {
  return Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
}

/**
 * `expiresAt`(서버 동기화) 또는 `durationSeconds`(로컬 고정) 기준 목표 시각까지 매초 감소하는 카운트다운.
 * 0에 도달하면 `onExpire`를 정확히 한 번 호출한다.
 *
 * 목표 시각 계산, 최초 잔여초 반영, 만료 체크를 모두 하나의 effect 안에서 동기적으로 처리한다.
 * (렌더 중에는 ref를 읽거나 쓰지 않는다 — 이 프로젝트는 React Compiler를 사용하므로 렌더 중 ref
 * mutation은 순수성 가정을 깨 예기치 못한 메모이제이션 버그로 이어질 수 있다.)
 * 이렇게 effect 하나로 묶어야, `expiresAt`이 뒤늦게 로드되어 `enabled`가 false→true로 바뀌는
 * 순간에도 "방금 계산한 값"으로 바로 만료 여부를 판단해 오래된(stale) 값을 읽는 경쟁 상태가 생기지 않는다.
 */
export function useCountdown({
  expiresAt,
  durationSeconds,
  onExpire,
  enabled = true,
}: UseCountdownOptions) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const durationStartMs = Date.now();
    let hasExpired = false;

    const getTargetMs = () => {
      if (expiresAt) return new Date(expiresAt).getTime();
      if (durationSeconds != null) return durationStartMs + durationSeconds * 1000;
      return null;
    };

    if (!enabled) {
      return;
    }

    const targetMs = getTargetMs();
    if (targetMs == null) {
      return;
    }

    const tick = () => {
      const remaining = secondsUntil(targetMs);
      setSecondsLeft(remaining);
      if (remaining <= 0 && !hasExpired) {
        hasExpired = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, durationSeconds, enabled]);

  return { secondsLeft };
}
