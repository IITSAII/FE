import LogoAnimation from "../../../shared/assets/images/LogoAnimation.gif";

export interface IntroStepProps {
  onNext?: () => void;
}

/**
 * 인트로 화면 플로우 단계 컴포넌트 (IntroStep)
 * - 로고 애니메이션 gif를 무한 재생하며, 화면 클릭 시 다음 플로우 단계로 이동합니다.
 */
export function IntroStep({ onNext }: IntroStepProps) {
  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px 대응) */}
      <button
        type="button"
        onClick={onNext}
        aria-label="화면을 터치해 다음 단계로 이동"
        className="w-full max-w-[834px] flex-1 px-6 pt-[250.71px] pb-[329.67px] flex flex-col items-center text-center"
      >
        <img
          src={LogoAnimation}
          alt="잇, 사이 로고 애니메이션"
          className="w-full h-auto pointer-events-none select-none"
        />

        <div className="flex flex-col items-center gap-2">
          <p className="text-ipad-heading-2-medium text-black">
            화면을 터치해 주세요.
          </p>
          <p className="text-ipad-body-1-light text-gray-600">Touch Screen</p>
        </div>
      </button>
    </div>
  );
}
