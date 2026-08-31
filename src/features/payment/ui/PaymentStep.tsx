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

  const clientKey =
    (import.meta.env.TOSS_CLIENT_KEY as string | undefined) ||
    (import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined) ||
    "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

  useEffect(() => {
    let isMounted = true;

    async function initTossWidget() {
      try {
        setIsLoading(true);
        const tossPayments = await loadTossPayments(clientKey);
        if (!isMounted) return;

        const widgetsInstance = tossPayments.widgets({
          customerKey: ANONYMOUS,
        });

        await widgetsInstance.setAmount({
          currency: "KRW",
          value: totalPrice,
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
          setErrorMessage("결제 위젯을 불러오는 중 오류가 발생했습니다.");
          setIsLoading(false);
        }
      }
    }

    initTossWidget();

    return () => {
      isMounted = false;
    };
  }, [clientKey, totalPrice]);

  const handlePayment = async () => {
    if (!widgets) return;

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // orderId를 키로 주문 정보를 sessionStorage에 보존 (fail 페이지 retry 복원용)
    sessionStorage.setItem(
      `pending_order_${orderId}`,
      JSON.stringify({ totalPrice, personnelCount }),
    );

    try {
      await widgets.requestPayment({
        orderId,
        orderName: `잇, 사이 사진 촬영 (${personnelCount}인)`,
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
      });
    } catch (err) {
      console.error("Payment request failed:", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px 대응) */}
      <main className="w-full max-w-[834px] px-6 pt-18 pb-[53.5px] flex-1 flex flex-col justify-between">
        {/* 타이틀 영역 */}
        <div className="w-full pt-15 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            결제를 진행해주세요 !
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            선택한 수량({personnelCount}인) 및 금액(
            {totalPrice.toLocaleString()}원) 확인 후 결제해주세요.
          </p>
        </div>

        {/* 결제 정보 및 위젯 영역 */}
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
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          {/* 결제 UI 영역 */}
          <div id="payment-method" className="w-full"></div>
          {/* 이용약관 UI 영역 */}
          <div id="agreement" className="w-full"></div>

          {errorMessage && (
            <div className="text-red-500 text-center py-2 text-sm">
              {errorMessage}
            </div>
          )}
        </div>

        {/* 하단 네비게이션 버튼 (뒤로가기 & 결제하기 버튼) */}
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
            disabled={isLoading || !widgets}
            className="rounded-full py-5"
          >
            {isLoading
              ? "위젯 로딩 중..."
              : `${totalPrice.toLocaleString()}원 결제하기`}
          </Button>

          <div />
        </div>
      </main>
    </div>
  );
}
