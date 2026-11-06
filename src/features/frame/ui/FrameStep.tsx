import { useMemo, useRef, useState } from "react";
import type {
  PhotoFrameTheme,
  PhotoFilter,
} from "../../../shared/ui/PhotoFrame/PhotoFrame";
import { FrameRenderer } from "../../../shared/ui/PhotoFrame/FrameRenderer";
import {
  DEFAULT_FRAME_ID,
  FRAME_LIST,
  type FrameId,
} from "../../../shared/ui/PhotoFrame/frames";
import SlashIcon from "../../../shared/assets/icons/SlashIcon.svg?react";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { useCountdown } from "../../../shared/hooks/useCountdown";
import { useStepExpiry } from "../../../shared/hooks/useStepExpiry";
import { buildGalleryUrl } from "../../../shared/lib/qrCode";
import { formatFrameDate } from "../../../shared/lib/date";
import { selectFrame } from "../api/printApi";
import { isApiError } from "../../../shared/lib/apiError";
import type { CapturedPhoto } from "../../photo/ui/PhotoStep";
import RightArrowIcon from "../../../shared/assets/icons/RightArrowIcon.svg?react";
import { trackEvent } from "../../../shared/lib/analytics";

/** BE `PrintJobErrorCode.FRAME_ALREADY_SELECTED`의 코드. */
const FRAME_ALREADY_SELECTED_CODE = "PRINT400_2";

export interface FrameStepData {
  frameId: FrameId;
  theme: PhotoFrameTheme;
  filter: PhotoFilter;
  date: string;
}

export interface FrameStepProps {
  sessionId: string;
  selectedPhotos?: CapturedPhoto[];
  relationshipTitle?: string | null;
  onNext?: (data: FrameStepData) => void;
  onBack?: () => void;
}

export const THEME_CATEGORIES = [
  { id: "pichimothan", name: "피치못한" },
  { id: "majuhada", name: "마주하다" },
  { id: "overnook", name: "오버눅" },
  { id: "banjjak", name: "반짝" },
];

/**
 * 프레임 선택 플로우 단계 컴포넌트 (FrameStep)
 * - 이전 단계에서 선택한 4장의 사진을 받아 네컷 사진 프레임을 구성하고,
 * - 프레임 설정(frames.ts)에 정의된 프레임과 필터를 선택합니다.
 */
export function FrameStep({
  sessionId,
  selectedPhotos = [],
  relationshipTitle,
  onNext,
}: FrameStepProps) {
  const [frameId, setFrameId] = useState<FrameId>(DEFAULT_FRAME_ID);
  const [selectedThemeId] = useState<PhotoFrameTheme>("pichimothan");
  const [filter, setFilter] = useState<PhotoFilter>("default");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  const { status } = useStepExpiry(sessionId);
  const photoUrls = selectedPhotos.map((photo) => photo.dataUrl);
  const qrCodeUrl = buildGalleryUrl(sessionId);
  const frameDate = useMemo(() => formatFrameDate(), []);

  const proceed = async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    try {
      await selectFrame(sessionId, {
        frameType: frameId,
        filterBw: filter === "grayscale",
        filterBrightness: 0,
      });
    } catch (err) {
      console.error("프레임 선택 저장 실패:", err);

      // 프레임 저장은 단계를 넘기지 않아 상태 조회로 알 수 없다. 이전 요청의 응답만 끊긴 경우
      // 다시 보내면 이미 선택됐다는 에러가 오므로, 이때는 그대로 진행한다.
      if (!isApiError(err) || err.code !== FRAME_ALREADY_SELECTED_CODE) {
        hasSubmittedRef.current = false;
        setIsSubmitting(false);
        setSubmitError("프레임 선택 저장에 실패했습니다. 다시 시도해주세요.");
        return;
      }
    }

    trackEvent("frame_select", { frame: frameId, filter });
    onNext?.({
      frameId,
      theme: selectedThemeId,
      filter,
      date: frameDate,
    });
  };

  const handleNextStep = () => {
    proceed();
  };

  const handleExpire = () => {
    trackEvent("step_timeout", { step: "frame" });
    // 만료 시 마지막으로 선택해둔(또는 기본값인) frameId/theme/filter 그대로 진행한다.
    proceed();
  };

  const { secondsLeft } = useCountdown({
    expiresAt: status?.stepExpiresAt,
    enabled: status?.stepExpiresAt != null && !isSubmitting,
    onExpire: handleExpire,
  });

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px) */}
      <main className="w-full max-w-[834px] px-6 pt-18 pb-13 flex-1 flex flex-col">
        {/* 서브 타이머 */}
        <div className="w-full flex justify-end">
          {status?.stepExpiresAt && (
            <span className="text-ipad-heading-1-medium text-gray-600">
              {secondsLeft}
            </span>
          )}
        </div>

        {/* 타이틀 영역 */}
        <div className="w-full pt-15 pb-15 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            프레임을 정해주세요!
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            {submitError ?? "프레임 및 필터도 조정할 수 있어요."}
          </p>
        </div>

        {/* 메인 뷰: 좌측 프레임 미리보기 (452px) + 우측 테마/색상 컨트롤 (172px) */}
        <div className="w-full flex gap-16.75 pb-14.25">
          {/* 좌측: 실시간 PhotoFrame 축소 미리보기 */}
          <div className="w-113 h-172.75 bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
            <div className="origin-center shrink-0 scale-[0.3467]">
              <FrameRenderer
                frameId={frameId}
                theme={selectedThemeId}
                photos={photoUrls}
                relationship={relationshipTitle || "Friend"}
                date={frameDate}
                qrCodeUrl={qrCodeUrl}
                filter={filter}
              />
            </div>
          </div>

          {/* 우측: 프레임 디자인/색상(다크/라이트) 및 브랜드 테마 선택 컨트롤 */}
          <div className="w-66 flex flex-col gap-16 shrink-0 pt-8.5">
            {/* 1. 프레임 선택 */}
            <div className="flex flex-col gap-6">
              <h3 className="text-ipad-heading-3-medium text-black">프레임</h3>
              <div className="flex flex-wrap items-center gap-3">
                {FRAME_LIST.map(({ id, label, thumbnail }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFrameId(id)}
                    className={`flex items-center justify-center w-20 h-20 rounded-[4px] ${thumbnail.buttonClassName} border-2 box-border transition-all cursor-pointer ${
                      frameId === id
                        ? "border-green-500"
                        : `${thumbnail.unselectedBorderClassName} opacity-40`
                    }`}
                    aria-label={`${label} 프레임 선택`}
                  >
                    <thumbnail.Icon className={thumbnail.iconClassName} />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 필터 선택 (기본 / 흑백) */}
            <div className="flex flex-col gap-6">
              <h3 className="text-ipad-heading-3-medium text-black">필터</h3>
              <div className="flex items-center gap-3">
                {/* 기본 필터 버튼 */}
                <button
                  type="button"
                  onClick={() => setFilter("default")}
                  className={`flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    filter === "default" ? "opacity-100" : "opacity-40"
                  }`}
                  aria-label="기본 필터 선택"
                >
                  <div
                    className={`flex items-center justify-center w-20 h-20 rounded-[4px] bg-frame-dark border-2 box-border ${
                      filter === "default"
                        ? "border-green-500"
                        : "border-transparent"
                    }`}
                  >
                    <SlashIcon className="w-9 h-9 text-white" />
                  </div>
                  <span className="text-ipad-body-1-light text-gray-600">
                    기본
                  </span>
                </button>

                {/* 흑백 필터 버튼 */}
                <button
                  type="button"
                  onClick={() => setFilter("grayscale")}
                  className={`flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    filter === "grayscale" ? "opacity-100" : "opacity-40"
                  }`}
                  aria-label="흑백 필터 선택"
                >
                  <div
                    className={`relative w-20 h-20 rounded-[4px] bg-white border-2 box-border overflow-hidden ${
                      filter === "grayscale"
                        ? "border-green-500"
                        : "border-gray-400"
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-frame-dark" />
                  </div>
                  <span className="text-ipad-body-1-light text-gray-600">
                    흑백
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 네비게이션 버튼 */}
        <div className="w-full flex items-center justify-end">
          <IconButton
            variant="primary"
            onClick={handleNextStep}
            disabled={isSubmitting}
            aria-label="다음 단계로 이동"
          >
            <RightArrowIcon className="w-8 h-8 text-green-200" />
          </IconButton>
        </div>
      </main>
    </div>
  );
}
