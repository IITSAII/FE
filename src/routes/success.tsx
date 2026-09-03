import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "../shared/ui/Button/Button";
import { isApiError } from "../shared/lib/apiError";
import { confirmPayment } from "../features/payment/api/paymentApi";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
});

function SuccessPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const paymentKey = searchParams.get("paymentKey");
  const sessionId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const parsedAmount = Number(amount);

    async function requestConfirm() {
      if (
        !paymentKey ||
        !sessionId ||
        !amount ||
        !Number.isFinite(parsedAmount)
      ) {
        setErrorMessage("결제 정보가 올바르지 않습니다.");
        setStatus("error");
        return;
      }

      try {
        const result = await confirmPayment(
          sessionId,
          { paymentKey, amount: parsedAmount },
          controller.signal,
        );

        if (!isMounted) return;

        if (result.status === "PAID") {
          sessionStorage.setItem("payment_confirmed_session_id", sessionId);
          setStatus("success");
        } else {
          setErrorMessage(
            `결제 상태를 확인할 수 없습니다. (status: ${result.status})`,
          );
          setStatus("error");
        }
      } catch (err) {
        // 언마운트로 인한 요청 취소는 사용자에게 노출하지 않는다.
        if (isApiError(err) && err.code === "CANCELED") return;

        console.error("Payment confirmation failed:", err);
        if (isMounted) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "결제 승인 중 오류가 발생했습니다.",
          );
          setStatus("error");
        }
      }
    }

    requestConfirm();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [paymentKey, sessionId, amount]);

  const handleNextStep = () => {
    navigate({ to: "/", search: { step: "relation" } });
  };

  useEffect(() => {
    if (status !== "success") return;

    const timer = setTimeout(handleNextStep, 1500);
    return () => clearTimeout(timer);
  }, [status]);

  const handleRetry = () => {
    navigate({
      to: "/fail",
      search: {
        code: "CONFIRM_ERROR",
        message: errorMessage ?? undefined,
      } as any,
    });
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center text-center gap-6">
        {status === "loading" ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">
              결제 승인 처리 중입니다...
            </p>
          </div>
        ) : status === "error" ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-3xl font-bold">
              ✕
            </div>
            <h2 className="text-2xl font-bold text-black">
              결제 승인에 실패하였습니다
            </h2>
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
            <Button
              variant="primary"
              onClick={handleRetry}
              className="w-full py-3.5 rounded-xl font-bold text-base mt-2"
            >
              결제 다시 시도하기
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-black">
              결제가 성공적으로 완료되었습니다!
            </h2>

            <div className="w-full bg-gray-50 rounded-xl p-4 flex flex-col gap-3 text-left text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">주문번호</span>
                <span className="font-semibold text-gray-800">
                  {sessionId || "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">결제 금액</span>
                <span className="font-semibold text-green-600">
                  {amount ? `${Number(amount).toLocaleString()}원` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">paymentKey</span>
                <span className="font-mono text-xs text-gray-600 truncate max-w-[250px]">
                  {paymentKey || "-"}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleNextStep}
              className="w-full py-3.5 rounded-xl font-bold text-base mt-2"
            >
              다음 단계로 이동 (관계 선택)
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
