import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "../shared/ui/Button/Button";
import { isApiError } from "../shared/lib/apiError";
import { isRetryableError, withRetry } from "../shared/lib/retry";
import {
  confirmPayment,
  getSessionStatus,
} from "../features/payment/api/paymentApi";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
});

/** 결제 실패 후 재진입 시 결제 화면에서 실패 모달을 띄우기 위한 세션 플래그. */
const PAYMENT_FAILED_FLAG_KEY = "payment_failed";

/**
 * 승인 결과를 알 수 없을 때 다시 요청하는 횟수와 간격(ms). 서버는 같은 세션의 승인을 멱등하게
 * 처리하고 토스에도 orderId를 Idempotency-Key로 보내므로, 다시 요청해도 이중 승인되지 않는다.
 */
const CONFIRM_RETRIES = 3;
const CONFIRM_RETRY_DELAY_MS = 2000;

/** 서버에서 승인이 진행 중이거나 이미 끝났을 수 있어, 실패로 단정하면 안 되는 에러인지 판단한다. */
function isUncertainConfirmError(error: unknown): boolean {
  return isRetryableError(error) || (isApiError(error) && error.status === 409);
}

function SuccessPage() {
  const navigate = useNavigate();
  const [isUnresolved, setIsUnresolved] = useState(false);
  const [confirmAttempt, setConfirmAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function confirmAndProceed() {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentKey = searchParams.get("paymentKey");
      const sessionId = searchParams.get("orderId");
      const amount = searchParams.get("amount");
      const parsedAmount = Number(amount);

      if (
        !paymentKey ||
        !sessionId ||
        !amount ||
        !Number.isFinite(parsedAmount)
      ) {
        sessionStorage.setItem(PAYMENT_FAILED_FLAG_KEY, "1");
        navigate({ to: "/", search: { step: "payment" } });
        return;
      }

      const proceedToRelation = () => {
        sessionStorage.setItem("payment_confirmed_session_id", sessionId);
        navigate({ to: "/", search: { step: "relation" } });
      };

      const returnToPaymentWithFailure = () => {
        sessionStorage.setItem(PAYMENT_FAILED_FLAG_KEY, "1");
        navigate({ to: "/", search: { step: "payment" } });
      };

      // withRetry는 마지막 에러만 던진다. 앞선 시도가 불확실했다면 마지막 에러가 명확한 실패여도
      // 첫 요청이 서버에서 승인됐을 수 있으므로, 시도 이력을 따로 기억한다.
      let sawUncertainOutcome = false;

      try {
        const result = await withRetry(
          () =>
            confirmPayment(
              sessionId,
              { paymentKey, amount: parsedAmount },
              controller.signal,
            ),
          {
            retries: CONFIRM_RETRIES,
            delayMs: CONFIRM_RETRY_DELAY_MS,
            shouldRetry: (retryErr) => {
              const isUncertain = isUncertainConfirmError(retryErr);
              if (isUncertain) sawUncertainOutcome = true;
              return isUncertain;
            },
          },
        );

        if (result.status === "PAID") {
          proceedToRelation();
        } else {
          returnToPaymentWithFailure();
        }
      } catch (err) {
        // 언마운트로 인한 요청 취소는 사용자에게 노출하지 않는다.
        if (isApiError(err) && err.code === "CANCELED") return;

        console.error("Payment confirmation failed:", err);

        // 승인 응답이 타임아웃으로 끊겼거나, 이미 승인된 세션에 재요청해 400(INVALID_STEP)을 받은 경우에도
        // 서버에서는 결제가 완료됐을 수 있다. 실패로 처리하기 전에 세션 상태를 다시 확인한다.
        let isSessionExpired = false;
        try {
          const status = await getSessionStatus(sessionId, controller.signal);
          if (status.status === "PAID") {
            proceedToRelation();
            return;
          }
          isSessionExpired = status.status === "EXPIRED";
        } catch (statusErr) {
          if (isApiError(statusErr) && statusErr.code === "CANCELED") return;
          console.error("결제 상태 재확인 실패:", statusErr);
        }

        // 결과를 끝내 알 수 없으면 새 세션으로 재결제하게 두지 않는다. 첫 결제가 서버에서 승인됐다면
        // 이중 청구되고, 이 승인은 세션이 만료된 경우에만 자동 취소되기 때문이다.
        if (
          (sawUncertainOutcome || isUncertainConfirmError(err)) &&
          !isSessionExpired
        ) {
          setIsUnresolved(true);
          return;
        }

        returnToPaymentWithFailure();
      }
    }

    confirmAndProceed();

    return () => controller.abort();
  }, [navigate, confirmAttempt]);

  const handleRetryConfirm = () => {
    setIsUnresolved(false);
    setConfirmAttempt((attempt) => attempt + 1);
  };

  const handleResetToIntro = () => {
    sessionStorage.removeItem("payment_session_id");
    sessionStorage.removeItem("payment_confirmed_session_id");
    sessionStorage.removeItem("payment_quantity");
    sessionStorage.removeItem(PAYMENT_FAILED_FLAG_KEY);
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-ipad-background font-primary flex flex-col items-center justify-center gap-2 px-6 text-center">
      {isUnresolved ? (
        <>
          <h2 className="text-ipad-heading-2-medium text-black">
            결제 확인이 지연되고 있어요
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            다시 결제하지 마시고 직원을 불러주세요.
          </p>
          <p className="text-ipad-body-1-light text-gray-600">
            주문번호 {new URLSearchParams(window.location.search).get("orderId")}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" size="inline" onClick={handleRetryConfirm}>
              다시 확인
            </Button>
            <Button variant="gray" size="inline" onClick={handleResetToIntro}>
              처음으로
            </Button>
          </div>
        </>
      ) : (
        <p className="text-ipad-body-1-light text-gray-600">
          결제를 확인하고 있어요.
        </p>
      )}
    </div>
  );
}
