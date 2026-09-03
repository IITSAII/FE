import { useState, useEffect, useRef, useCallback } from "react";
import { MissionCard } from "../../../shared/ui/Card/MissionCard";
import { uploadPhoto } from "../api/photoApi";
import { dataUrlToBlob } from "../../../shared/lib/dataUrl";

export interface CapturedPhoto {
  photoId: number | null;
  shotNumber: number;
  dataUrl: string;
}

export interface PhotoStepData {
  photos: CapturedPhoto[];
}

export interface PhotoStepProps {
  sessionId: string;
  selectedRelationTitle?: string | null;
  totalPhotosCount?: number;
  timerDurationSeconds?: number;
  onNext?: (data: PhotoStepData) => void;
  onBack?: () => void;
}

// 관계 선택 시 제공할 6가지 미션 포즈 예시
const DEFAULT_MISSIONS = [
  {
    title: "검지 들고 ‘엇!’ 하는 표정",
    description: "상대와 같은 포즈를 해요",
  },
  {
    title: "볼에 손가락 대고 유쾌하게 미소짓기",
    description: "서로 다른 앙증맞은 표정을 지어보세요",
  },
  {
    title: "서로의 얼굴을 마주보고 웃어보기",
    description: "장난스러운 눈빛으로 카메라를 바라보세요",
  },
  {
    title: "어깨를 감싸쥐고 사이좋게 브이!",
    description: "다정한 케미를 자랑해보세요",
  },
  {
    title: "서로에게 하트를 건네는 포즈",
    description: "손하트로 설레는 순간을 남기세요",
  },
  {
    title: "자유 포즈! 제일 당당한 표정 짓기",
    description: "마지막 사진을 멋지게 장식해 보세요",
  },
];

/**
 * 사진 촬영 플로우 단계 컴포넌트 (PhotoStep)
 * - 웹캠 카메라 화면과 연결하여 실시간 미션 및 6장 자동 촬영을 진행합니다.
 * - 관계 미설정 시 미션 카드를 숨기고 카메라 뷰 영역을 최상단으로 배치합니다.
 */
export function PhotoStep({
  sessionId,
  selectedRelationTitle,
  totalPhotosCount = 6,
  timerDurationSeconds = 10,
  onNext,
}: PhotoStepProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); // 0..5
  const [countdown, setCountdown] = useState(timerDurationSeconds);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedPhotosRef = useRef<CapturedPhoto[]>([]);
  const uploadPromisesRef = useRef<Promise<void>[]>([]);

  const updateCapturedPhotos = useCallback(
    (updater: (prev: CapturedPhoto[]) => CapturedPhoto[]) => {
      setCapturedPhotos((prev) => {
        const next = updater(prev);
        capturedPhotosRef.current = next;
        return next;
      });
    },
    [],
  );

  const hasRelation =
    Boolean(selectedRelationTitle) &&
    selectedRelationTitle !== "관계 설정 안 함";

  // 카메라 비디오 스트림 연결
  useEffect(() => {
    let isMounted = true;

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (isMounted) {
          console.warn("카메라 연결 실패 또는 권한 없음:", err);
          setCameraError(
            "카메라에 연결할 수 없습니다. 시뮬레이션 모드로 진행됩니다.",
          );
        }
      }
    }

    setupCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // 사진 촬영 캡처 함수
  const capturePhoto = useCallback(() => {
    let dataUrl = "";

    const isStreamActive =
      streamRef.current !== null &&
      streamRef.current.getTracks().some((t) => t.readyState === "live");

    if (
      videoRef.current &&
      canvasRef.current &&
      isStreamActive &&
      videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 585;
      canvas.height = video.videoHeight || 778;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // 전면 카메라 좌우 반전 처리
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL("image/png");
      }
    }

    // 비디오 미연결 시 가상 캔버스 썸네일 생성
    if (!dataUrl) {
      const fallbackCanvas = document.createElement("canvas");
      fallbackCanvas.width = 585;
      fallbackCanvas.height = 778;
      const ctx = fallbackCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#30372f";
        ctx.fillRect(0, 0, 585, 778);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Photo ${currentPhotoIndex + 1}`, 585 / 2, 778 / 2);
        dataUrl = fallbackCanvas.toDataURL("image/png");
      }
    }

    return dataUrl;
  }, [currentPhotoIndex]);

  // 모든 사진이 캡처된 후 정확히 한 번만 onNext 호출하는 완료 플래그
  const onNextCalledRef = useRef(false);

  // 카운트다운 타이머 및 자동 샷 로직
  useEffect(() => {
    if (currentPhotoIndex >= totalPhotosCount) {
      return;
    }

    if (countdown === 0) {
      const shotNumber = currentPhotoIndex + 1;
      const dataUrl = capturePhoto();
      updateCapturedPhotos((photos) => [
        ...photos,
        { photoId: null, shotNumber, dataUrl },
      ]);

      // 촬영 즉시 백엔드에 업로드하고, 완료되면 로컬 상태에 photoId를 반영한다.
      const uploadPromise = uploadPhoto(
        sessionId,
        shotNumber,
        dataUrlToBlob(dataUrl),
      )
        .then((info) => {
          updateCapturedPhotos((photos) =>
            photos.map((photo) =>
              photo.shotNumber === shotNumber
                ? { ...photo, photoId: info.photoId }
                : photo,
            ),
          );
        })
        .catch((err) => {
          console.error(`사진 업로드 실패 (shot ${shotNumber}):`, err);
        });
      uploadPromisesRef.current.push(uploadPromise);

      setCurrentPhotoIndex((idx) => idx + 1);
      setCountdown(timerDurationSeconds);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [
    countdown,
    currentPhotoIndex,
    totalPhotosCount,
    timerDurationSeconds,
    capturePhoto,
    sessionId,
    updateCapturedPhotos,
  ]);

  // capturedPhotos가 totalPhotosCount에 도달하면, 업로드가 모두 끝난 뒤 정확히 한 번 onNext 호출
  useEffect(() => {
    if (
      capturedPhotos.length === totalPhotosCount &&
      !onNextCalledRef.current
    ) {
      onNextCalledRef.current = true;
      (async () => {
        await Promise.allSettled(uploadPromisesRef.current);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onNext?.({ photos: capturedPhotosRef.current });
      })();
    }
  }, [capturedPhotos, totalPhotosCount, onNext]);

  const currentMission =
    DEFAULT_MISSIONS[currentPhotoIndex % DEFAULT_MISSIONS.length];

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 캔버스 (스크린샷 생성용 오프스크린 DOM) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 메인 프레임 영역 (최대 너비 834px) */}
      <main className="w-full max-w-[834px] px-6 pt-16 pb-12 flex-1 flex flex-col items-center">
        {/* 상단 진행률 (1/6) 및 타이머 (10) 서브 네비바 */}
        <div className="w-full max-w-[786px] flex items-center justify-between">
          <span className="text-ipad-heading-1-medium text-gray-900">
            {Math.min(currentPhotoIndex + 1, totalPhotosCount)}/
            {totalPhotosCount}
          </span>

          {/* 서브 타이머 */}
          <span className="text-ipad-heading-1-medium text-gray-600">
            {countdown}
          </span>
        </div>

        {/* 관계 설정이 켜져 있는 경우: 미션 카드 영역 상단 노출 */}
        {hasRelation && (
          <div className="w-full pt-[51.73px]">
            <MissionCard
              title={currentMission.title}
              description={currentMission.description}
              isSelected={false}
              className="w-full mx-auto"
            />
          </div>
        )}

        {/* 카메라 화면 (좌측 585px) + 세로 6개 썸네일 박스 (우측 171px) */}
        <div
          className={`w-full max-w-[786px] flex items-start gap-7.5 h-[778px] ${hasRelation ? "pt-7" : "pt-[35.75px]"}`}
        >
          {/* 좌측 카메라 라이브 피드 (585px) */}
          <div className="relative w-[585px] h-[778px] bg-gray-900 overflow-hidden shrink-0 flex items-center justify-center border-[1.5px] border-gray-300">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* 카메라 에러 또는 시뮬레이션 알림 */}
            {cameraError && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                <p className="text-ipad-heading-3-medium">{cameraError}</p>
                <p className="text-ipad-body-2-light text-gray-300">
                  타이머에 맞춰 자동으로 촬영 시뮬레이션이 진행됩니다.
                </p>
              </div>
            )}

            {/* 촬영 순간 플래시 효과 */}
            {countdown === 1 && (
              <div className="absolute inset-0 bg-white opacity-80 animate-out fade-out duration-300 pointer-events-none" />
            )}
          </div>

          {/* 우측 세로 6개 찍은 사진 썸네일 슬롯 (171px x 118px) */}
          <div className="w-[171px] h-[778px] flex flex-col justify-between shrink-0">
            {Array.from({ length: totalPhotosCount }).map((_, index) => {
              const photo = capturedPhotos[index];

              return (
                <div
                  key={index}
                  className="w-[171px] h-[118px] border transition-all overflow-hidden flex items-center justify-center bg-gray-100 border-gray-300"
                >
                  {photo ? (
                    <img
                      src={photo.dataUrl}
                      alt={`촬영 사진 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
