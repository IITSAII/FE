import { useState, useEffect, useRef } from "react";

export interface LoadingStepProps {
  onComplete?: () => void;
  onBack?: () => void;
}

const LOADING_PHRASES = [
  "QR코드 촬영하면",
  "사진 저장",
  "매장 할인 혜택",
  "해당 매장 길찾기",
  "스토리 매거진까지!",
];

/**
 * 사진 인화 및 출력 로딩 플로우 단계 컴포넌트 (LoadingStep)
 * - 0%부터 100%까지 사진 출력 프로그레스를 진행하고 인화 완료 시 안내 메시지를 표시합니다.
 */
export function LoadingStep({ onComplete }: LoadingStepProps) {
  const [progress, setProgress] = useState(0);
  const onCompleteCalledRef = useRef(false);

  useEffect(() => {
    if (progress >= 100) return;

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 100));
    }, 150);

    return () => clearInterval(timer);
  }, [progress]);

  // progress가 100에 도달하면 정확히 한 번 onComplete 호출
  useEffect(() => {
    if (progress >= 100 && !onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true;
      onComplete?.();
    }
  }, [progress, onComplete]);

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px) */}
      <main className="w-full max-w-[834px] px-6 pt-43.75 pb-[53.5px] flex-1 flex flex-col">
        {/* 타이틀 영역 */}
        <div className="w-full pt-15 pb-13 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            사진을 인화 중입니다!
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            인화한 사진을 가지고 화면 속 매장에 방문하면 혜택을 받을 수 있어요.
          </p>
        </div>

        {/* 업체 위치 및 QR 영역 */}
        <div className="w-full h-173.5 flex gap-4 items-center">
          {/* 업체별 위치 svg 파일 */}
          <div className="w-[519px] h-full bg-gray-100" />

          <div className="flex flex-col justify-between w-[251px] h-full pt-[32.57px] pb-[85.89px] bg-gray-900">
            <div className="pl-[27.33px] pr-[38.67px] flex flex-col text-ipad-heading-4-medium text-iphone-background">
              {LOADING_PHRASES.map((phrase, index) => {
                const isActive = progress >= index * 20;
                return (
                  <p
                    key={phrase}
                    className={`transition-opacity duration-500 ${
                      isActive ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    {phrase}
                  </p>
                );
              })}
            </div>

            {/* QR 영역 */}
            <div className="flex flex-col items-center">
              <div className="w-[191px] bg-ipad-background p-2.5 flex flex-col items-center justify-center gap-2">
                <p className="text-iphone-heading-1-semibold text-green-950 whitespace-nowrap">
                  overnook's Benefit
                </p>
                <p className="text-ipad-body-3-medium text-green-950 whitespace-nowrap">
                  인화 수만큼 스탬프 적립 !
                </p>
              </div>

              <div className="size-6.5 bg-ipad-background" />

              <div className="size-[190px] bg-ipad-background flex justify-center items-center">
                <div className="size-[150px] bg-green-950" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
