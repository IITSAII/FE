import { useState, useEffect, useRef } from "react";
import {
  PhotoFrame,
  type PhotoFrameVariant,
  type PhotoFrameTheme,
  type PhotoFilter,
} from "../../../shared/ui/PhotoFrame/PhotoFrame";
import { JobokFrame } from "../../../shared/ui/PhotoFrame/JobokFrame";
import { QrCode } from "../../../shared/ui/QrCode/QrCode";
import { Button } from "../../../shared/ui/Button/Button";
import { buildGalleryUrl } from "../../../shared/lib/qrCode";
import { exportFrameImage } from "../../frame/lib/exportFrameImage";
import { applyColorCorrectionToPhotos } from "../../frame/lib/colorCorrection";
import { uploadFinalImage } from "../../frame/api/printApi";
import type { FrameDesign } from "../../frame/ui/FrameStep";
import { getAssignedPartner } from "../../partner-location/api/partnerApi";
import banjjakBenefitImage from "../assets/banjjak.png";
import majuhadaBenefitImage from "../assets/majuhada.png";
import overnookBenefitImage from "../assets/overnook.png";
import pichimothanBenefitImage from "../assets/pichimothan.png";

/** 배정된 제휴업체명으로 로딩 화면에 노출할 안내 이미지를 찾는다. */
function getPartnerBenefitImage(partnerName: string): string {
  if (partnerName.includes("피치못한")) return pichimothanBenefitImage;
  if (partnerName.includes("반짝")) return banjjakBenefitImage;
  if (partnerName.includes("마주하다")) return majuhadaBenefitImage;
  return overnookBenefitImage;
}

/** 배정된 제휴업체명으로 로딩 화면에 노출할 업체 표시명을 찾는다. */
function getPartnerDisplayName(partnerName: string): string {
  if (partnerName.includes("피치못한")) return "피치못한";
  if (partnerName.includes("반짝")) return "반짝이는 모든 것들";
  if (partnerName.includes("마주하다")) return "마주하다";
  return "overnook";
}

/** 배정된 제휴업체명으로 로딩 화면에 노출할 혜택 문구를 찾는다. */
function getPartnerBenefitText(partnerName: string): string {
  if (partnerName.includes("피치못한"))
    return "아메리카노/복복에이드 300원 할인!";
  if (partnerName.includes("반짝")) return "3번 누적 구매 시, 5% 할인!";
  if (partnerName.includes("마주하다")) return "전상품 5% 할인!";
  return "스탬프 +1 적립 !";
}

export interface LoadingStepProps {
  sessionId: string;
  photos?: string[];
  relationshipTitle?: string | null;
  design?: FrameDesign;
  variant?: PhotoFrameVariant;
  theme?: PhotoFrameTheme;
  filter?: PhotoFilter;
  date: string;
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

/** 한 줄이 밝아지는 데 걸리는 간격(ms) */
const PHRASE_REVEAL_INTERVAL_MS = 1000;
/** 마지막 줄까지 다 밝아진 뒤 추가로 대기하는 시간(ms) */
const PHRASE_REVEAL_HOLD_MS = 5000;

/**
 * 사진 인화 및 출력 로딩 플로우 단계 컴포넌트 (LoadingStep)
 * - 화면 밖에 실물 크기 PhotoFrame을 렌더링해 최종 이미지로 캡처, 서버에 업로드한다.
 * - 0%부터 100%까지 사진 출력 프로그레스를 진행하고, 업로드 완료 + 진행률 100% 둘 다 충족해야 완료 처리한다.
 */
export function LoadingStep({
  sessionId,
  photos = [],
  relationshipTitle,
  design = "default",
  variant = "dark",
  theme = "pichimothan",
  filter = "default",
  date,
  onComplete,
  onBack,
}: LoadingStepProps) {
  const [progress, setProgress] = useState(0);
  const [correctedPhotos, setCorrectedPhotos] = useState<
    (string | undefined | null)[]
  >(photos);
  const [isUploadDone, setIsUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activePhraseCount, setActivePhraseCount] = useState(0);
  const [isPhraseSequenceDone, setIsPhraseSequenceDone] = useState(false);
  const [assignedPartnerName, setAssignedPartnerName] = useState<string | null>(
    null,
  );
  const onCompleteCalledRef = useRef(false);
  const captureNodeRef = useRef<HTMLDivElement>(null);
  const uploadStartedRef = useRef(false);

  const qrCodeUrl = buildGalleryUrl(sessionId);

  // 결제 확정 시 세션에 배정된 제휴업체를 조회해 안내 이미지/문구에 반영한다.
  useEffect(() => {
    const controller = new AbortController();
    getAssignedPartner(sessionId, controller.signal)
      .then((partner) => setAssignedPartnerName(partner.name))
      .catch(() => {});
    return () => controller.abort();
  }, [sessionId]);

  useEffect(() => {
    if (progress >= 100) return;

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 100));
    }, 150);

    return () => clearInterval(timer);
  }, [progress]);

  // 안내 문구를 한 줄씩 순서대로 밝히고, 마지막 줄까지 끝나면 일정 시간 대기한다.
  useEffect(() => {
    const timers = LOADING_PHRASES.map((_, index) =>
      setTimeout(
        () => setActivePhraseCount(index + 1),
        index * PHRASE_REVEAL_INTERVAL_MS,
      ),
    );

    const doneTimer = setTimeout(
      () => setIsPhraseSequenceDone(true),
      (LOADING_PHRASES.length - 1) * PHRASE_REVEAL_INTERVAL_MS +
        PHRASE_REVEAL_HOLD_MS,
    );
    timers.push(doneTimer);

    return () => timers.forEach(clearTimeout);
  }, []);

  // 화면 밖 PhotoFrame을 캡처해 최종 이미지로 업로드한다(정확히 한 번).
  useEffect(() => {
    if (uploadStartedRef.current) return;
    uploadStartedRef.current = true;

    async function captureAndUpload() {
      try {
        // 촬영 사진에 색상보정(노출/그림자/대비)을 픽셀 단위로 적용해 캡처용 사진을 준비한다.
        // 원본 사진 자체를 바꾸는 게 아니라 캡처 노드에만 반영되는 보정본을 별도로 만든다.
        const corrected = await applyColorCorrectionToPhotos(photos);
        setCorrectedPhotos(corrected);

        // 폰트 로딩 완료 + 2번의 rAF(레이아웃·페인트 반영)를 기다린 뒤 캡처한다.
        // 고정된 100ms 대기로는 기기/네트워크가 느릴 때(iPad 등) 캡처 시점에 QR 캔버스나
        // 이미지가 아직 페인트되지 않아 프레임만 캡처되는 경우가 있어 조건 기반 대기로 교체.
        // 색상보정본으로 <img src>가 갱신되는 리렌더까지 함께 기다려야 하므로 rAF 대기는
        // setCorrectedPhotos 이후에 수행한다.
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        if (!captureNodeRef.current) {
          throw new Error("캡처할 프레임을 찾을 수 없습니다.");
        }
        const blob = await exportFrameImage(captureNodeRef.current);
        await uploadFinalImage(sessionId, blob);
        setIsUploadDone(true);
        setUploadError(null);
      } catch (err) {
        // 캡처(exportFrameImage) 단계에서 실패하면 업로드 요청 자체가 나가지 않으므로,
        // 실패 지점(캡처 vs 업로드)과 원인을 구분할 수 있도록 에러 정보를 자세히 남긴다.
        console.error("최종 이미지 업로드 실패:", {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          sessionId,
        });
        setUploadError("사진 인화 준비 중 오류가 발생했습니다.");
      }
    }

    captureAndUpload();
    // photos는 세션당 한 번 촬영이 끝나면 이후 값이 바뀌지 않는 배열이고, uploadStartedRef로
    // 이펙트가 정확히 한 번만 실행되도록 이미 가드하고 있어 deps에서 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, retryCount]);

  const handleRetryUpload = () => {
    uploadStartedRef.current = false;
    setUploadError(null);
    setRetryCount((count) => count + 1);
  };

  // 진행률 100% + 업로드 완료 + 안내 문구 애니메이션 종료가 모두 충족되면 정확히 한 번 onComplete 호출
  useEffect(() => {
    if (
      progress >= 100 &&
      isUploadDone &&
      isPhraseSequenceDone &&
      !onCompleteCalledRef.current
    ) {
      onCompleteCalledRef.current = true;
      onComplete?.();
    }
  }, [progress, isUploadDone, isPhraseSequenceDone, onComplete]);

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 실물 크기 PhotoFrame — 최종 이미지 캡처 전용, 화면에는 보이지 않는다.
          뷰포트 좌표 (0,0)에 두고 크기 0 + overflow-hidden인 부모로 잘라서 숨긴다.
          `-9999px`처럼 뷰포트에서 아주 멀리 떨어뜨리면 Safari/WebKit(아이패드 등)에서
          html-to-image가 foreignObject를 래스터화할 때 사진·QR 같은 자식 이미지/캔버스가
          누락되는 경우가 있어(프레임 배경만 캡처됨), opacity·visibility 대신 이 방식으로 숨긴다. */}
      <div
        className="fixed top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div ref={captureNodeRef}>
          {design === "jobok" ? (
            <JobokFrame
              variant={variant}
              photos={correctedPhotos}
              date={date}
              qrCodeUrl={qrCodeUrl}
              filter={filter}
            />
          ) : (
            <PhotoFrame
              variant={variant}
              theme={theme}
              photos={correctedPhotos}
              relationship={relationshipTitle || "Friend"}
              date={date}
              qrCodeUrl={qrCodeUrl}
              filter={filter}
            />
          )}
        </div>
      </div>

      {/* 메인 프레임 영역 (최대 너비 834px) */}
      <main className="w-full max-w-[834px] px-6 pt-43.75 flex-1 flex flex-col">
        {/* 타이틀 영역 */}
        <div className="w-full pb-15 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            사진을 인화 중입니다!
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            {uploadError
              ? uploadError
              : "인화한 사진을 가지고 화면 속 매장에 방문하면 혜택을 받을 수 있어요."}
          </p>
          {uploadError && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="inline"
                onClick={handleRetryUpload}
              >
                다시 시도
              </Button>
              {onBack && (
                <Button variant="gray" size="inline" onClick={onBack}>
                  처음으로 돌아가기
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 업체 위치 및 QR 영역 */}
        <div className="w-full h-173.75 flex gap-4 items-center">
          {/* 업체별 위치 안내 이미지 */}
          {assignedPartnerName ? (
            <img
              src={getPartnerBenefitImage(assignedPartnerName)}
              alt={`${assignedPartnerName} 위치 안내`}
              className="w-129.75 h-full object-cover"
            />
          ) : (
            <div className="w-129.75 h-full bg-gray-100" />
          )}

          <div className="flex flex-col justify-between items-center w-62.75 h-full pt-7.75 pb-22 bg-gray-900">
            <div className="flex flex-col text-ipad-heading-4-medium text-iphone-background">
              {LOADING_PHRASES.map((phrase, index) => {
                const isActive = index < activePhraseCount;
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
              <div className="w-47.75 bg-ipad-background p-2.5 flex flex-col items-center justify-center gap-2">
                <p className="text-iphone-heading-1-semibold text-green-950 whitespace-nowrap">
                  {getPartnerDisplayName(assignedPartnerName ?? "")}
                </p>
                <p className="text-ipad-body-3-medium text-green-950 whitespace-nowrap">
                  {getPartnerBenefitText(assignedPartnerName ?? "")}
                </p>
              </div>

              <div className="size-6.5 bg-ipad-background" />

              <div className="size-47.5 bg-ipad-background flex justify-center items-center">
                <QrCode
                  url={qrCodeUrl}
                  size={150}
                  dotsColor="#0a2e1f"
                  backgroundColor="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
