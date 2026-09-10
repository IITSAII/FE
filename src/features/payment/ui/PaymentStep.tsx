import { useEffect, useRef, useState } from "react";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { Button } from "../../../shared/ui/Button/Button";
import { Card } from "../../../shared/ui/Card/Card";
import { useModal } from "../../../shared/hooks/useModal";
import LeftArrowIcon from "../../../shared/assets/icons/LeftArrowIcon.svg?react";
import { isApiError } from "../../../shared/lib/apiError";
import { useCountdown } from "../../../shared/hooks/useCountdown";
import { createSession, getSessionStatus } from "../api/paymentApi";
import { AuthCodeModal } from "./AuthCodeModal";

export interface PaymentStepProps {
  totalPrice?: number;
  personnelCount?: number;
  onNext?: () => void;
  onBack?: () => void;
  /** 타이머 만료 시 호출된다(인증 모달을 닫고 인트로 화면으로 복귀). */
  onExpire?: () => void;
  /** 세션 생성 직후(sessionId 확보 시) 호출된다. */
  onSessionCreated?: (sessionId: string) => void;
}

export function PaymentStep({
  totalPrice = 3000,
  personnelCount = 2,
  onNext,
  onBack,
  onExpire,
  onSessionCreated,
}: PaymentStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverAmount, setServerAmount] = useState<number | null>(null);
  const [stepExpiresAt, setStepExpiresAt] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const onSessionCreatedRef = useRef(onSessionCreated);
  onSessionCreatedRef.current = onSessionCreated;

  const {
    isOpen: isAuthModalOpen,
    openModal: openAuthModal,
    closeModal: closeAuthModal,
  } = useModal();

  const resolvedAmount = serverAmount ?? totalPrice;

  const handleExpire = () => {
    setIsExpired(true);
    setErrorMessage("시간이 초과되었습니다. 처음부터 다시 진행해주세요.");
    closeAuthModal();
    setTimeout(() => onExpire?.(), 1500);
  };

  const { secondsLeft } = useCountdown({
    expiresAt: stepExpiresAt,
    enabled: stepExpiresAt != null && !isExpired,
    onExpire: handleExpire,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function initSession() {
      setErrorMessage(null);
      setSessionId(null);
      setServerAmount(null);

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
        onSessionCreatedRef.current?.(nextSessionId);

        try {
          const status = await getSessionStatus(
            nextSessionId,
            controller.signal,
          );
          if (isMounted) setStepExpiresAt(status.stepExpiresAt);
        } catch (statusErr) {
          if (!(isApiError(statusErr) && statusErr.code === "CANCELED")) {
            console.error("세션 상태 조회 실패:", statusErr);
          }
        }

        if (isMounted) setIsLoading(false);
      } catch (err) {
        // 언마운트로 인한 요청 취소는 사용자에게 노출하지 않는다.
        if (isApiError(err) && err.code === "CANCELED") return;

        console.error("Failed to create payment session:", err);
        if (isMounted) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "결제 정보를 불러오는 중 오류가 발생했습니다.",
          );
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [personnelCount, totalPrice]);

  const handlePayment = () => {
    if (!sessionId || serverAmount == null || isExpired) return;
    openAuthModal();
  };

  // 인증 코드가 확인되면 결제 완료로 간주하고 다음 단계로 넘어간다.
  const handleAuthVerified = () => {
    if (!sessionId) return;
    closeAuthModal();
    sessionStorage.setItem("payment_confirmed_session_id", sessionId);
    onNext?.();
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[834px] px-6 pt-18 pb-13 flex-1 flex flex-col">
        {/* 서브 타이머 */}
        <div className="w-full flex justify-end">
          {stepExpiresAt && (
            <span className="text-ipad-heading-1-medium text-gray-600">
              {secondsLeft}
            </span>
          )}
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

        <div className="w-full flex items-center justify-center gap-20 pt-50 pb-42.75 px-[65.5px]">
          {/* 임시 프레임 */}
          <div className="w-36.5 h-109.25 flex flex-col gap-[2.26px] bg-frame-dark/80">
            <div className="w-[119.96px] h-[82.48px] bg-gray-100" />
            <div className="w-[119.96px] h-[82.48px] bg-gray-100" />
            <div className="w-[119.96px] h-[82.48px] bg-gray-100" />
            <div className="w-[119.96px] h-[82.48px] bg-gray-100" />
          </div>

          {/* 결제 영수증 카드 */}
          <div className="w-106.75 flex flex-col items-center gap-10 my-auto">
            <Card className="w-full px-[42.15px] py-[61.73px] gap-2">
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

                <div className="w-full flex items-center justify-between border-t border-gray-100 pt-2.5 pb-0.5 px-3">
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
              disabled={isLoading || !sessionId || isExpired}
              className="w-full rounded-[8px] py-4 text-ipad-heading-2-medium text-green-200 max-w-106.75"
            >
              {isExpired
                ? "시간이 초과되었습니다"
                : isLoading
                  ? "결제 정보 준비 중..."
                  : `${resolvedAmount.toLocaleString()}원 결제하기`}
            </Button>
          </div>
        </div>

        {/* 뒤로가기 */}
        <div className="w-full flex justify-start">
          <IconButton
            variant="outline"
            onClick={onBack}
            aria-label="이전 단계로 이동"
          >
            <LeftArrowIcon className="w-8 h-8 text-gray-500" />
          </IconButton>
        </div>
      </main>

      <AuthCodeModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onVerified={handleAuthVerified}
      />
    </div>
  );
}
