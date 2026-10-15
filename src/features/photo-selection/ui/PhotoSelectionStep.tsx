import { useRef, useState } from "react";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { useCountdown } from "../../../shared/hooks/useCountdown";
import { useStepExpiry } from "../../../shared/hooks/useStepExpiry";
import { selectPhotos } from "../api/photoSelectionApi";
import type { CapturedPhoto } from "../../photo/ui/PhotoStep";
import { getPhotos, uploadPhoto } from "../../photo/api/photoApi";
import { dataUrlToBlob } from "../../../shared/lib/dataUrl";
import { withRetry } from "../../../shared/lib/retry";
import RightArrowIcon from "../../../shared/assets/icons/RightArrowIcon.svg?react";

export interface PhotoSelectionStepData {
  selectedPhotos: CapturedPhoto[];
}

export interface PhotoSelectionStepProps {
  sessionId: string;
  capturedPhotos?: CapturedPhoto[];
  maxSelectCount?: number;
  onNext?: (data: PhotoSelectionStepData) => void;
  onBack?: () => void;
}

function pickRandomIndices(
  totalCount: number,
  excludeIndices: number[],
  count: number,
): number[] {
  const excludeSet = new Set(excludeIndices);
  const candidates = Array.from({ length: totalCount }, (_, i) => i).filter(
    (i) => !excludeSet.has(i),
  );
  // Fisher-Yates 셔플 후 앞에서부터 필요한 개수만 취한다.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}

/**
 * photoId가 없는(촬영 중 업로드 실패) 사진의 photoId를 채운다.
 * 응답만 끊기고 서버에는 저장된 경우가 있으므로 서버 목록을 먼저 확인하고, 없으면 다시 업로드한다.
 * 그래도 실패한 사진은 photoId가 null인 채로 반환한다.
 */
async function resolvePhotoIds(
  sessionId: string,
  photos: CapturedPhoto[],
): Promise<CapturedPhoto[]> {
  if (photos.every((photo) => photo.photoId != null)) return photos;

  const uploaded = await getPhotos(sessionId).catch(() => []);
  const photoIdByShot = new Map(
    uploaded.map((info) => [info.shotNumber, info.photoId]),
  );

  return Promise.all(
    photos.map(async (photo) => {
      if (photo.photoId != null) return photo;

      const uploadedId = photoIdByShot.get(photo.shotNumber);
      if (uploadedId != null) return { ...photo, photoId: uploadedId };

      try {
        const info = await withRetry(() =>
          uploadPhoto(sessionId, photo.shotNumber, dataUrlToBlob(photo.dataUrl)),
        );
        return { ...photo, photoId: info.photoId };
      } catch (err) {
        console.error(`사진 재업로드 실패 (shot ${photo.shotNumber}):`, err);
        return photo;
      }
    }),
  );
}

/**
 * 6개 사진 중 4개 사진 선택 플로우 단계 컴포넌트 (PhotoSelectionStep)
 * - 이전 단계에서 촬영한 6장의 사진 중 4장을 선택하여 우측 메인 프레임에 배치합니다.
 */
export function PhotoSelectionStep({
  sessionId,
  capturedPhotos = [],
  maxSelectCount = 4,
  onNext,
}: PhotoSelectionStepProps) {
  // 선택된 사진들의 인덱스 목록 (선택된 순서 보장: 0..3)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  const { status } = useStepExpiry(sessionId);

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

  const proceed = async (indicesToSubmit: number[]) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 촬영 중 업로드에 실패해 photoId가 없는 사진이 있으면 여기서 보정한다.
      // (6장이 모두 업로드돼야 서버가 SELECT 단계로 넘어가므로, 보정 없이는 선택 저장이 항상 실패한다.)
      const photos = await resolvePhotoIds(sessionId, capturedPhotos);

      // 랜덤으로 채울 때는 업로드가 끝난(photoId가 있는) 사진만 후보로 쓴다.
      const missingIdIndices = photos.flatMap((photo, idx) =>
        photo.photoId == null ? [idx] : [],
      );
      const finalIndices =
        indicesToSubmit.length >= maxSelectCount
          ? indicesToSubmit.slice(0, maxSelectCount)
          : [
              ...indicesToSubmit,
              ...pickRandomIndices(
                photos.length,
                [...indicesToSubmit, ...missingIdIndices],
                maxSelectCount - indicesToSubmit.length,
              ),
            ];

      const selectedPhotos = finalIndices.map((idx) => photos[idx]);
      const photoIds = selectedPhotos
        .map((photo) => photo?.photoId)
        .filter((id): id is number => id != null);

      if (photoIds.length !== maxSelectCount) {
        throw new Error(
          "일부 사진의 photoId가 없어 선택을 저장할 수 없습니다.",
        );
      }
      await selectPhotos(sessionId, photoIds);
      onNext?.({ selectedPhotos });
    } catch (err) {
      console.error("사진 선택 저장 실패:", err);
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
      setSubmitError("사진 선택 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleNextStep = () => {
    if (selectedIndices.length < maxSelectCount) return;
    proceed(selectedIndices);
  };

  const handleExpire = () => {
    // 만료 시 이미 선택해둔 사진은 유지하고, 남은 슬롯만 랜덤으로 채운다.
    proceed(selectedIndices);
  };

  const { secondsLeft } = useCountdown({
    expiresAt: status?.stepExpiresAt,
    enabled: status?.stepExpiresAt != null && !isSubmitting,
    onExpire: handleExpire,
  });

  const isNextEnabled = selectedIndices.length === maxSelectCount;

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px) */}
      <main className="w-full max-w-208.5 px-6 pt-18 pb-13 flex-1 flex flex-col justify-between">
        {/* 서브 타이머 */}
        <div className="w-full flex justify-end">
          <span className="text-ipad-heading-1-medium text-gray-600">
            {secondsLeft}
          </span>
        </div>

        {/* 타이틀 영역 */}
        <div className="w-full pt-15 pb-26 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            사진을 선택해주세요!
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            {submitError ?? `최대 ${maxSelectCount}장까지 선택 가능해요.`}
          </p>
        </div>

        {/* 사진 선택 메인 구역 (좌측 4개 선택 프레임 + 우측 6개 사진 그리스) */}
        <div className="w-full flex flex-col items-start gap-5 pb-22.5">
          <div className="w-full flex justify-end">
            <span className="text-ipad-heading-1-medium text-gray-900">
              {selectedIndices.length}/{maxSelectCount}
            </span>
          </div>
          <div className="w-full flex items-start gap-21 justify-between">
            {/* 좌측: 선택한 4장 세로 프레임 미리보기 (185px x 551px) */}
            <div className="w-46.25 h-137.75 flex flex-col gap-[2.85px] bg-frame-dark">
              {Array.from({ length: maxSelectCount }).map((_, slotIndex) => {
                const photoIndex = selectedIndices[slotIndex];
                const photo =
                  photoIndex !== undefined ? capturedPhotos[photoIndex] : null;

                return (
                  <div
                    key={slotIndex}
                    className="w-38 h-26 overflow-hidden bg-gray-100 flex items-center justify-center relative"
                  >
                    {photo && (
                      <>
                        <img
                          src={photo.dataUrl}
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
              {capturedPhotos.map((photo, index) => {
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
                      src={photo.dataUrl}
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
            disabled={!isNextEnabled || isSubmitting}
            aria-label="다음 단계로 이동"
          >
            <RightArrowIcon className="w-8 h-8 text-green-200" />
          </IconButton>
        </div>
      </main>
    </div>
  );
}
