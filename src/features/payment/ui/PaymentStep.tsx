import { useEffect, useState } from "react";
import {
  loadTossPayments,
  ANONYMOUS,
  type TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { Button } from "../../../shared/ui/Button/Button";
import { Card } from "../../../shared/ui/Card/Card";
import LeftArrowIcon from "../../../shared/assets/icons/LeftArrowIcon.svg?react";
import { isApiError } from "../../../shared/lib/apiError";
import { createSession } from "../api/paymentApi";

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
    const controller = new AbortController();

    async function initTossWidget() {
      setErrorMessage(null);
      setWidgets(null);
      setSessionId(null);
      setServerAmount(null);

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

        const session = await createSession(personnelCount, controller.signal);

        const nextSessionId = session.sessionId;
        const nextAmount = Number(session.amount ?? totalPrice);

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

        if (isMounted) {
          setWidgets(widgetsInstance);
          setIsLoading(false);
        }
      } catch (err) {
        // 언마운트로 인한 요청 취소는 사용자에게 노출하지 않는다.
        if (isApiError(err) && err.code === "CANCELED") return;

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
      controller.abort();
    };
  }, [clientKey, personnelCount, totalPrice]);

  const handlePayment = async () => {
    if (!widgets || !sessionId || serverAmount == null) return;

    try {
      const paymentWindow = await widgets.renderPaymentWindow({
        variantKey: {
          paymentMethod: "DEFAULT",
          agreement: "AGREEMENT",
        },
      });

      paymentWindow.on("paymentRequest", async () => {
        try {
          await widgets.requestPayment({
            orderId: sessionId,
            orderName: `잇, 사이 사진 촬영 (${personnelCount}인)`,
            successUrl: `${window.location.origin}/success`,
            failUrl: `${window.location.origin}/fail`,
          });
        } catch (err) {
          console.error("Payment request failed:", err);
          setErrorMessage(
            "결제 요청 중 오류가 발생했습니다. 다시 시도해주세요.",
          );
        }
      });
    } catch (err) {
      console.error("Failed to open payment window:", err);
      setErrorMessage(
        "결제창을 여는 중 오류가 발생했습니다. 다시 시도해주세요.",
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[834px] px-6 pt-18 pb-[53.5px] flex-1 flex flex-col justify-between">
        {/* 서브 타이머 */}
        <div className="w-full flex justify-end">
          <span className="text-ipad-heading-1-medium text-gray-600">60</span>
        </div>

        {/* 타이틀 영역 */}
        <div className="w-full pt-15 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            결제를 진행해주세요!
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            선택한 수량 및 금액을 확인 후 결제해주세요.
          </p>
        </div>

        {/* 결제 영수증 카드 */}
        <div className="w-full flex flex-col items-center gap-17.5 my-auto">
          <Card className="max-w-155.75 px-[61.5px] py-[61.88px] gap-2">
            <div className="w-full flex flex-col gap-12.5">
              <div className="w-full flex flex-col gap-7 text-ipad-heading-3-medium text-black">
                <div className="flex items-center justify-between">
                  <span>상품 금액</span>
                  <span className="font-poppins">
                    ₩ {resolvedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>상품 수량</span>
                  <span>{personnelCount}장</span>
                </div>
              </div>

              <div className="w-full flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-ipad-heading-2-medium text-black">
                  총 결제 금액
                </span>
                <span className="text-ipad-heading-3-medium text-green-500 font-poppins">
                  ₩ {resolvedAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {errorMessage && (
              <p className="text-red-500 text-center text-sm pt-2">
                {errorMessage}
              </p>
            )}
          </Card>

          <Button
            variant="dark"
            onClick={handlePayment}
            disabled={isLoading || !widgets || !sessionId}
            className="w-full rounded-[8px] py-4 text-ipad-heading-2-medium text-green-200 max-w-155.75"
          >
            {isLoading
              ? "결제 정보 준비 중..."
              : `${resolvedAmount.toLocaleString()}원 결제하기`}
          </Button>
        </div>

        {/* 결제 CTA 및 뒤로가기 */}
        <div className="w-full flex flex-col items-start">
          <IconButton
            variant="outline"
            onClick={onBack}
            aria-label="이전 단계로 이동"
          >
            <LeftArrowIcon className="w-8 h-8 text-gray-500" />
          </IconButton>
        </div>
      </main>
    </div>
  );
}
