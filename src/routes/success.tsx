import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { isApiError } from "../shared/lib/apiError";
import {
  confirmPayment,
  getSessionStatus,
} from "../features/payment/api/paymentApi";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
});

/** 결제 실패 후 재진입 시 결제 화면에서 실패 모달을 띄우기 위한 세션 플래그. */
const PAYMENT_FAILED_FLAG_KEY = "payment_failed";

function SuccessPage() {
  const navigate = useNavigate();

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

      try {
        const result = await confirmPayment(
          sessionId,
          { paymentKey, amount: parsedAmount },
          controller.signal,
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
        try {
          const status = await getSessionStatus(sessionId, controller.signal);
          if (status.status === "PAID") {
            proceedToRelation();
            return;
          }
        } catch (statusErr) {
          if (isApiError(statusErr) && statusErr.code === "CANCELED") return;
          console.error("결제 상태 재확인 실패:", statusErr);
        }

        returnToPaymentWithFailure();
      }
    }

    confirmAndProceed();

    return () => controller.abort();
  }, [navigate]);

  // 결제 승인 처리가 끝날 때까지 짧게 대기하는 동안에도 별도의 성공 화면은 노출하지 않는다.
  return <div className="min-h-screen bg-ipad-background" />;
}
