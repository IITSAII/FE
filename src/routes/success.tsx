import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { isApiError } from "../shared/lib/apiError";
import { confirmPayment } from "../features/payment/api/paymentApi";

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

      try {
        const result = await confirmPayment(
          sessionId,
          { paymentKey, amount: parsedAmount },
          controller.signal,
        );

        if (result.status === "PAID") {
          sessionStorage.setItem("payment_confirmed_session_id", sessionId);
          navigate({ to: "/", search: { step: "relation" } });
        } else {
          sessionStorage.setItem(PAYMENT_FAILED_FLAG_KEY, "1");
          navigate({ to: "/", search: { step: "payment" } });
        }
      } catch (err) {
        // 언마운트로 인한 요청 취소는 사용자에게 노출하지 않는다.
        if (isApiError(err) && err.code === "CANCELED") return;

        console.error("Payment confirmation failed:", err);
        sessionStorage.setItem(PAYMENT_FAILED_FLAG_KEY, "1");
        navigate({ to: "/", search: { step: "payment" } });
      }
    }

    confirmAndProceed();

    return () => controller.abort();
  }, [navigate]);

  // 결제 승인 처리가 끝날 때까지 짧게 대기하는 동안에도 별도의 성공 화면은 노출하지 않는다.
  return <div className="min-h-screen bg-ipad-background" />;
}
