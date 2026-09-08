import { useState, useEffect, useRef, useCallback } from "react";
import { MissionCard } from "../../../shared/ui/Card/MissionCard";
import { uploadPhoto } from "../api/photoApi";
import { dataUrlToBlob } from "../../../shared/lib/dataUrl";
import {
  applyColorCorrectionToImageData,
  colorCorrectionCssFilter,
  DEFAULT_COLOR_CORRECTION,
} from "../../frame/lib/colorCorrection";

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
  selectedRelationId?: string | null;
  selectedRelationTitle?: string | null;
  totalPhotosCount?: number;
  timerDurationSeconds?: number;
  onNext?: (data: PhotoStepData) => void;
  onBack?: () => void;
}

// 관계별 추천 포즈 미션 목록 및 하단 안내 문구
const MISSIONS_BY_RELATION: Record<
  string,
  { description: string; poses: string[] }
> = {
  close: {
    description: "상대와 같은 포즈를 해요",
    poses: [
      "양손 주먹으로 턱받침!",
      "한 손으로 입 가리기!",
      "어깨동무하고 브이!",
      "양손으로 턱받침!",
      "두 손으로 입가리기!",
      "카메라 쳐다보면서 거래처 악수!",
      "둘 다 팔짱끼고 고개 갸웃!",
      "어깨를 맞대고 팔짱 끼기!",
      "한 손으로 브이하기!",
      "양손으로 엄지 척!",
    ],
  },
  friend: {
    description: "둘의 케미를 보여주세요",
    poses: [
      "양손 주먹으로 턱받침!",
      "서로 귀엽게 째려보기!",
      "붙어서 브이!",
      "양손으로 턱받침!",
      "한 사람이 다른 사람한테 볼콕!",
      "서로 엇갈리게 큰 하트!",
      "둘 다 팔짱끼고 고개 갸웃!",
      "어깨를 맞대고 팔짱 끼기!",
      "한 손으로 브이하기!",
      "엇갈리게 같은 방향으로 큰 하트!",
      "함께 손하트!",
      "윙크하고 입가에 손가락 콕!",
    ],
  },
  some: {
    description: "설레는 케미를 보여주세요",
    poses: [
      "서로 바라보면서 한 컷!",
      "한 사람이 앞에서 손하트, 상대는 그 안에 얼굴 쏙!",
      "한 명이 다른 한 명 바라보기!",
      "각자 한 손 볼콕!",
      "팔짱끼고 어깨 콩!",
      "둘이서 손하트 만들기!",
      "ET 포즈! 손가락 맞대기",
      "둘 다 양손 꽃받침!",
      "오타쿠 하트 하기!",
      "한 사람이 귓속말 하는 척!",
    ],
  },
  lover: {
    description: "둘의 다정함을 보여주세요",
    poses: [
      "한 사람이 양손으로 볼 감싸기!",
      "한 사람이 상대 볼을 감싸고, 둘 다 입술 우~!",
      "한 사람은 뒤에서 안고 머리 쓰담, 다른 한 사람은 양손 볼콕!",
      "한 사람이 양손으로 상대 볼콕!",
      "한 사람이 한 손으로 상대 볼콕!",
      "한 사람이 앞에서 손하트, 상대는 그 안에 얼굴 쏙!",
      "한 사람이 상대 볼을 감싸고, 한 사람만 입술 우~!",
      "서로 팔짱끼고 머리 콩!",
      "다정하게 백허그!",
      "백허그하면서 상대는 꽃받침!",
      "함께 손하트!",
      "다정하게 어깨에 기대기!",
    ],
  },
};

// 관계가 선택되지 않았을 때(또는 알 수 없는 관계일 때) 사용할 기본 미션
const DEFAULT_MISSION_SET = MISSIONS_BY_RELATION.close;

// 아이패드 등에서 기본으로 잡히는 초광각(Ultra Wide) 렌즈 명칭 패턴
const ULTRA_WIDE_LABEL_PATTERN = /ultra ?wide|울트라|초광각/i;

// zoom 트랙 제약은 표준 TS DOM 타입에 없는 실험적(Safari) 속성이라 별도 타입으로 취급
type ZoomCapableTrack = {
  getCapabilities?: () => MediaTrackCapabilities & {
    zoom?: { min: number; max: number };
  };
  applyConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
};

// 초광각 렌즈로 잡힌 트랙에 한해 확대(zoom)를 적용해 왜곡을 줄인다 (지원하는 브라우저에서만 동작)
function applyZoomIfSupported(track: MediaStreamTrack) {
  const zoomTrack = track as unknown as ZoomCapableTrack;
  const zoomCapability = zoomTrack.getCapabilities?.()?.zoom;
  if (!zoomCapability) return;

  const targetZoom = Math.min(
    zoomCapability.max,
    Math.max(zoomCapability.min, 2),
  );
  zoomTrack
    .applyConstraints({
      advanced: [{ zoom: targetZoom } as MediaTrackConstraintSet],
    })
    .catch((err) => console.warn("카메라 줌 조정 실패:", err));
}

// 전면 카메라가 초광각으로 잡힌 경우, 초광각이 아닌 다른 전면 카메라로 재연결을 시도한다.
// 대체 카메라가 없으면 zoom 제약으로 왜곡만 완화하고 기존 스트림을 그대로 사용한다.
async function preferMainCamera(stream: MediaStream): Promise<MediaStream> {
  const currentTrack = stream.getVideoTracks()[0];
  if (!currentTrack) return stream;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");

    const currentDeviceId = currentTrack.getSettings().deviceId;
    const currentDevice = videoInputs.find(
      (d) => d.deviceId === currentDeviceId,
    );

    const currentIsUltraWide = ULTRA_WIDE_LABEL_PATTERN.test(
      currentDevice?.label ?? "",
    );
    if (!currentIsUltraWide) {
      return stream;
    }

    const candidates = videoInputs.filter(
      (d) =>
        d.deviceId !== currentDeviceId &&
        !ULTRA_WIDE_LABEL_PATTERN.test(d.label),
    );

    for (const candidate of candidates) {
      try {
        const candidateStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: candidate.deviceId },
            facingMode: { exact: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        const candidateTrack = candidateStream.getVideoTracks()[0];
        if (candidateTrack?.getSettings().facingMode === "user") {
          stream.getTracks().forEach((track) => track.stop());
          return candidateStream;
        }

        candidateStream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn("대체 카메라 연결 실패:", err);
      }
    }

    applyZoomIfSupported(currentTrack);
    return stream;
  } catch (err) {
    console.warn("메인 카메라 선택 실패, 기본 카메라를 사용합니다:", err);
    return stream;
  }
}

/**
 * 사진 촬영 플로우 단계 컴포넌트 (PhotoStep)
 * - 웹캠 카메라 화면과 연결하여 실시간 미션 및 6장 자동 촬영을 진행합니다.
 * - 관계 미설정 시 미션 카드를 숨기고 카메라 뷰 영역을 최상단으로 배치합니다.
 */
export function PhotoStep({
  sessionId,
  selectedRelationId,
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
    Boolean(selectedRelationTitle) && selectedRelationTitle !== "Not Set";

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

        const preferredStream = await preferMainCamera(stream);

        if (!isMounted) {
          preferredStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = preferredStream;
        if (videoRef.current) {
          videoRef.current.srcObject = preferredStream;
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

        // 저장/업로드되는 실제 촬영 사진에 기본 색상보정(노출/그림자/대비)을
        // 픽셀 단위로 반영한다. 라이브 프리뷰의 CSS filter 근사치와 달리
        // 여기가 최종적으로 서버에 올라가는 이미지의 진짜 보정 단계다.
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyColorCorrectionToImageData(imageData, DEFAULT_COLOR_CORRECTION);
        ctx.putImageData(imageData, 0, 0);

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

  const missionSet =
    (selectedRelationId && MISSIONS_BY_RELATION[selectedRelationId]) ||
    DEFAULT_MISSION_SET;
  const currentMission = {
    title: missionSet.poses[currentPhotoIndex % missionSet.poses.length],
    description: missionSet.description,
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 캔버스 (스크린샷 생성용 오프스크린 DOM) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 메인 프레임 영역 (최대 너비 834px) */}
      <main
        className={`w-full max-w-[834px] px-6 flex-1 flex flex-col items-center ${hasRelation ? "pt-18" : "pt-43.25"}`}
      >
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
          <div className="w-full pt-13">
            <MissionCard
              title={currentMission.title}
              description={currentMission.description}
              isSelected={false}
              className="w-full"
            />
          </div>
        )}

        {/* 카메라 화면 (좌측 585px) + 세로 6개 썸네일 박스 (우측 171px) */}
        <div
          className={`w-full flex items-start gap-7.5 h-194.5 ${hasRelation ? "pt-12.75" : "pt-9"}`}
        >
          {/* 좌측 카메라 라이브 피드 (585px) */}
          <div className="relative w-146.25 h-194.5 bg-gray-900 overflow-hidden shrink-0 flex items-center justify-center border-[1.5px] border-gray-300">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
              // 실제 촬영 캡처에 적용되는 색상보정을 라이브 프리뷰에도 실시간으로 보여준다.
              // 매 프레임 픽셀 연산을 하기엔 비용이 커서 CSS filter 근사치를 쓰고,
              // 실제 저장되는 사진은 capturePhoto()에서 픽셀 단위로 정확히 보정한다.
              style={{ filter: colorCorrectionCssFilter(DEFAULT_COLOR_CORRECTION) }}
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
          <div className="w-42.75 h-194.5 flex flex-col justify-between shrink-0">
            {Array.from({ length: totalPhotosCount }).map((_, index) => {
              const photo = capturedPhotos[index];

              return (
                <div
                  key={index}
                  className="w-42.75 h-29.5 border transition-all overflow-hidden flex items-center justify-center bg-gray-100 border-gray-300"
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
