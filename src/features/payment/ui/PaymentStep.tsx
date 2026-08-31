import { useEffect, useState } from "react";
import {
  loadTossPayments,
  ANONYMOUS,
  type TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { Button } from "../../../shared/ui/Button/Button";
import LeftArrowIcon from "../../../shared/assets/icons/LeftArrowIcon.svg?react";

export interface PaymentStepProps {
  totalPrice?: number;
  personnelCount?: number;
  onNext?: () => void;
  onBack?: () => void;
}

export function PaymentStep({
  totalPrice = 3000,
  personnelCount = 2,
  onBack,
}: PaymentStepProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverAmount, setServerAmount] = useState<number | null>(null);

  const clientKey = import.meta.env.TOSS_CLIENT_KEY as string | undefined;
  const resolvedAmount = serverAmount ?? totalPrice;

  useEffect(() => {
    let isMounted = true;

    async function initTossWidget() {
      setErrorMessage(null);

      if (!clientKey) {
        if (!isMounted) return;
        setErrorMessage(
          "결제 환경변수가 설정되지 않았습니다. 관리자에게 문의해주세요.",
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const sessionResponse = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: personnelCount }),
        });

        const sessionData = await sessionResponse.json().catch(() => ({}));

        if (!sessionResponse.ok) {
          throw new Error(
            sessionData.message || "결제 세션 생성에 실패했습니다.",
          );
        }

        const nextSessionId = sessionData.sessionId;
        const nextAmount = Number(sessionData.amount ?? totalPrice);

        if (!nextSessionId || !Number.isFinite(nextAmount) || nextAmount <= 0) {
          throw new Error("결제 금액 정보를 받을 수 없습니다.");
        }

        if (!isMounted) return;

        setSessionId(nextSessionId);
        sessionStorage.setItem("payment_session_id", nextSessionId);
        setServerAmount(nextAmount);

        const tossPayments = await loadTossPayments(clientKey);
        const widgetsInstance = tossPayments.widgets({
          customerKey: ANONYMOUS,
        });

        await widgetsInstance.setAmount({
          currency: "KRW",
          value: nextAmount,
        });

        await Promise.all([
          widgetsInstance.renderPaymentMethods({
            selector: "#payment-method",
            variantKey: "DEFAULT",
          }),
          widgetsInstance.renderAgreement({
            selector: "#agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        if (isMounted) {
          setWidgets(widgetsInstance);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize Toss Payments widget:", err);
        if (isMounted) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "결제 위젯을 불러오는 중 오류가 발생했습니다.",
          );
          setIsLoading(false);
        }
      }
    }

    initTossWidget();

    return () => {
      isMounted = false;
    };
  }, [clientKey, personnelCount, totalPrice]);

  const handlePayment = async () => {
    if (!widgets || !sessionId || serverAmount == null) return;

    try {
      await widgets.requestPayment({
        orderId: sessionId,
        orderName: `잇, 사이 사진 촬영 (${personnelCount}인)`,
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
      });
    } catch (err) {
      console.error("Payment request failed:", err);
      setErrorMessage("결제 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[834px] px-6 pt-18 pb-[53.5px] flex-1 flex flex-col justify-between">
        <div className="w-full pt-15 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            결제를 진행해주세요 !
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            선택한 수량({personnelCount}인) 및 금액(
            {resolvedAmount.toLocaleString()}원) 확인 후 결제해주세요.
          </p>
        </div>

        <div className="w-full flex flex-col gap-6 my-auto max-w-[600px] mx-auto bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-gray-600 text-ipad-body-1-light">
              주문 상품
            </span>
            <span className="font-semibold text-black">
              잇, 사이 사진 촬영 ({personnelCount}인)
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-gray-600 text-ipad-body-1-light">
              총 결제 금액
            </span>
            <span className="text-xl font-bold text-green-500">
              {resolvedAmount.toLocaleString()}원
            </span>
          </div>

          <div id="payment-method" className="w-full"></div>
          <div id="agreement" className="w-full"></div>

          {errorMessage && (
            <div className="text-red-500 text-center py-2 text-sm">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="w-full flex items-center justify-between pt-10">
          <IconButton
            variant="outline"
            onClick={onBack}
            aria-label="이전 단계로 이동"
          >
            <LeftArrowIcon className="w-8 h-8 text-gray-500" />
          </IconButton>

          <Button
            variant="primary"
            size="inline"
            onClick={handlePayment}
            disabled={isLoading || !widgets || !sessionId}
            className="rounded-full py-5"
          >
            {isLoading
              ? "위젯 로딩 중..."
              : `${resolvedAmount.toLocaleString()}원 결제하기`}
          </Button>

          <div />
        </div>
      </main>
    </div>
  );
}
