import { useState } from "react";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import RightArrowIcon from "../../../shared/assets/icons/RightArrowIcon.svg?react";

export interface PhotoSelectionStepData {
  selectedPhotos: string[];
}

export interface PhotoSelectionStepProps {
  capturedPhotos?: string[];
  maxSelectCount?: number;
  onNext?: (data: PhotoSelectionStepData) => void;
  onBack?: () => void;
}

/**
 * 6개 사진 중 4개 사진 선택 플로우 단계 컴포넌트 (PhotoSelectionStep)
 * - 이전 단계에서 촬영한 6장의 사진 중 4장을 선택하여 우측 메인 프레임에 배치합니다.
 */
export function PhotoSelectionStep({
  capturedPhotos = [],
  maxSelectCount = 4,
  onNext,
}: PhotoSelectionStepProps) {
  // 선택된 사진들의 인덱스 목록 (선택된 순서 보장: 0..3)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleTogglePhoto = (index: number) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= maxSelectCount) {
        return prev;
      }
      return [...prev, index];
    });
  };

  const handleNextStep = () => {
    if (selectedIndices.length < maxSelectCount) {
      alert(`사진 ${maxSelectCount}장을 모두 선택해 주세요!`);
      return;
    }
    if (onNext) {
      const selectedPhotos = selectedIndices.map((idx) => capturedPhotos[idx]);
      onNext({ selectedPhotos });
    }
  };

  const isNextEnabled = selectedIndices.length === maxSelectCount;

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px) */}
      <main className="w-full max-w-208.5 px-6 pt-18 pb-[53.5px] flex-1 flex flex-col justify-between">
        {/* 서브 타이머 */}
        <div className="w-full flex justify-end">
          <span className="text-ipad-heading-1-medium text-gray-600">100</span>
        </div>

        {/* 타이틀 영역 */}
        <div className="w-full pt-15 pb-26 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            사진을 선택해주세요!
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            최대 {maxSelectCount}장까지 선택 가능해요.
          </p>
        </div>

        {/* 사진 선택 메인 구역 (좌측 4개 선택 프레임 + 우측 6개 사진 그리스) */}
        <div className="w-full flex flex-col items-start gap-5 pb-[51px]">
          <div className="w-full flex justify-end">
            <span className="text-ipad-heading-1-medium text-gray-900">
              {selectedIndices.length}/{maxSelectCount}
            </span>
          </div>
          <div className="w-full flex items-start gap-21.25 justify-between">
            {/* 좌측: 선택한 4장 세로 프레임 미리보기 (185px x 551px) */}
            <div className="w-46.25 h-137.75 flex flex-col gap-[2.85px] bg-frame-dark">
              {Array.from({ length: maxSelectCount }).map((_, slotIndex) => {
                const photoIndex = selectedIndices[slotIndex];
                const photoUrl =
                  photoIndex !== undefined ? capturedPhotos[photoIndex] : null;

                return (
                  <div
                    key={slotIndex}
                    className="w-38 h-30 overflow-hidden bg-gray-100 flex items-center justify-center relative"
                  >
                    {photoUrl && (
                      <>
                        <img
                          src={photoUrl}
                          alt={`선택된 사진 ${slotIndex + 1}`}
                          className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-200"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 우측: 촬영한 사진 2열 x 3행 사진 그리드 (516px) */}
            <div className="w-129 grid grid-cols-2 gap-4 shrink-0">
              {capturedPhotos.map((photoUrl, index) => {
                const selectedOrder = selectedIndices.indexOf(index);
                const isSelected = selectedOrder !== -1;

                return (
                  <div
                    key={index}
                    onClick={() => handleTogglePhoto(index)}
                    className={`relative w-62.5 h-43.25 overflow-hidden cursor-pointer border border-gray-300 transition-all group ${
                      isSelected ? "opacity-40" : ""
                    }`}
                  >
                    <img
                      src={photoUrl}
                      alt={`촬영 결과 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 하단 네비게이션 (뒤로가기 & 다음 버튼) */}
        <div className="w-full flex justify-end">
          <IconButton
            variant="primary"
            onClick={handleNextStep}
            disabled={!isNextEnabled}
            aria-label="다음 단계로 이동"
          >
            <RightArrowIcon className="w-8 h-8 text-green-200" />
          </IconButton>
        </div>
      </main>
    </div>
  );
}
