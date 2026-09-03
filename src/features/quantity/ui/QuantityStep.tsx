import { useState } from "react";
import { PersonnelCard } from "../../../shared/ui/Card/PersonnelCard";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { useCountdown } from "../../../shared/hooks/useCountdown";
import MinusIcon from "../../../shared/assets/icons/MinusIcon.svg?react";
import PlusIcon from "../../../shared/assets/icons/PlusIcon.svg?react";
import RightArrowIcon from "../../../shared/assets/icons/RightArrowIcon.svg?react";

export interface QuantityStepData {
  personnelCount: number;
  totalPrice: number;
}

const TIMER_DURATION_SECONDS = 60;

export interface QuantityStepProps {
  onNext?: (data: QuantityStepData) => void;
  onBack?: () => void;
  /** 타이머 만료 시 호출된다(인트로 화면으로 복귀). */
  onExpire?: () => void;
}

/**
 * 사진 수량 선택 플로우 단계 컴포넌트 (QuantityStep)
 * - 인원 수 및 수량을 선택하고 하단 다음 버튼 클릭 시 다음 플로우 단계로 전달합니다.
 * - 아직 세션이 생성되지 않은 단계라 서버 동기화 없이 로컬 60초 타이머로 동작한다.
 */
export function QuantityStep({ onNext, onExpire }: QuantityStepProps) {
  const [personnelCount, setPersonnelCount] = useState(2);
  const pricePerPerson = 1500;

  const { secondsLeft } = useCountdown({
    durationSeconds: TIMER_DURATION_SECONDS,
    onExpire,
  });

  const handleDecrease = () => {
    setPersonnelCount((prev) => Math.max(2, prev - 2));
  };

  const handleIncrease = () => {
    setPersonnelCount((prev) => Math.min(6, prev + 2));
  };

  const totalPrice = personnelCount * pricePerPerson;

  const handleNextStep = () => {
    if (onNext) {
      onNext({ personnelCount, totalPrice });
    }
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px 대응) */}
      <main className="w-full max-w-[834px] px-6 pt-18 pb-[53.5px] flex-1 flex flex-col justify-between">
        {/* 서브 타이머 */}
        <div className="w-full flex justify-end">
          <span className="text-ipad-heading-1-medium text-gray-600">
            {secondsLeft}
          </span>
        </div>

        {/* 타이틀 영역 */}
        <div className="w-full pt-15 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            수량을 선택해주세요!
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            선택한 사이에 맞춰 포즈 미션이 달라져요.
          </p>
        </div>

        {/* 인원 수 선택 영역 (Minus Button + PersonnelCard + Plus Button) */}
        <div className="w-full flex items-center justify-center gap-[47.44px] my-auto">
          <IconButton
            variant="secondary"
            onClick={handleDecrease}
            disabled={personnelCount <= 2}
            aria-label="인원 줄이기"
          >
            <MinusIcon className="w-8 h-8 text-white" />
          </IconButton>

          <PersonnelCard
            count={personnelCount}
            price={totalPrice}
            className="w-full"
          />

          <IconButton
            variant="secondary"
            onClick={handleIncrease}
            disabled={personnelCount >= 6}
            aria-label="인원 늘리기"
          >
            <PlusIcon className="w-8 h-8 text-white" />
          </IconButton>
        </div>

        {/* 하단 우측 다음 단계 이동 버튼 */}
        <div className="w-full flex justify-end pt-[104.12px]">
          <IconButton
            variant="primary"
            onClick={handleNextStep}
            aria-label="다음 단계로 이동"
          >
            <RightArrowIcon className="w-8 h-8 text-green-200" />
          </IconButton>
        </div>
      </main>
    </div>
  );
}
