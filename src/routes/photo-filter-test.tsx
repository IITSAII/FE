import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  applyColorCorrection,
  DEFAULT_COLOR_CORRECTION,
  type ColorCorrectionOptions,
} from "../features/frame/lib/colorCorrection";
import { Button } from "../shared/ui/Button/Button";

export const Route = createFileRoute("/photo-filter-test")({
  component: PhotoFilterTestPage,
});

/**
 * 색상보정 원본/적용본 비교 테스트 페이지 (PhotoFilterTestPage)
 * - 카메라로 직접 촬영한 사진에 실제 프로덕션 로직(`applyColorCorrection`)을 그대로 돌려
 *   원본과 보정본을 나란히 띄워 눈으로 바로 비교할 수 있다. 서버 전송 없음, 개발용 전용 경로.
 */
function PhotoFilterTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [correctedUrl, setCorrectedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exposure, setExposure] = useState(DEFAULT_COLOR_CORRECTION.exposure);
  const [shadow, setShadow] = useState(DEFAULT_COLOR_CORRECTION.shadow);
  const [contrast, setContrast] = useState(DEFAULT_COLOR_CORRECTION.contrast);

  // 카메라 스트림을 열고, 페이지를 떠날 때 트랙을 정리한다.
  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setCameraError(
            err instanceof Error ? err.message : "카메라를 열 수 없습니다.",
          );
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function runCorrection(url: string, options: ColorCorrectionOptions) {
    setIsProcessing(true);
    setError(null);
    try {
      const corrected = await applyColorCorrection(url, options);
      setCorrectedUrl(corrected);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const url = canvas.toDataURL("image/jpeg", 0.92);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setCorrectedUrl(null);
    setError(null);
    setOriginalUrl(url);
    runCorrection(url, { exposure, shadow, contrast });
  }

  function handleSliderCommit() {
    if (!originalUrl) return;
    runCorrection(originalUrl, { exposure, shadow, contrast });
  }

  return (
    <div className="min-h-screen bg-iphone-background p-6 md:p-12 font-primary text-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-gray-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-ipad-heading-1-medium text-gray-900">
              🎛️ 색상보정 원본/적용본 비교 (개발용)
            </h1>
            <p className="text-iphone-body-2-regular text-gray-600 mt-1">
              카메라로 촬영한 사진에 실제 인화 로직을 그대로 실행합니다. (서버 전송 없음)
            </p>
          </div>
          <Link
            to="/"
            className="text-iphone-body-1-semibold text-green-500 hover:text-green-600 underline"
          >
            메인으로 돌아가기 &rarr;
          </Link>
        </header>

        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h2 className="text-heading-1-semibold text-gray-900">
            1. 카메라 촬영
          </h2>
          {cameraError ? (
            <p className="text-sm text-red-500">
              카메라를 열지 못했습니다: {cameraError}
            </p>
          ) : (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md rounded-lg border border-gray-200 bg-black scale-x-[-1]"
              />
              <Button
                variant="primary"
                size="inline"
                onClick={handleCapture}
                disabled={!isCameraReady}
              >
                촬영
              </Button>
            </div>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h2 className="text-heading-1-semibold text-gray-900">
            2. 색상보정 값 (노출 / 그림자 / 대비)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">노출</span>
                <span className="text-xs text-gray-700">{exposure}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={exposure}
                onChange={(e) => setExposure(Number(e.target.value))}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">그림자</span>
                <span className="text-xs text-gray-700">{shadow}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={shadow}
                onChange={(e) => setShadow(Number(e.target.value))}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">대비</span>
                <span className="text-xs text-gray-700">{contrast}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                onMouseUp={handleSliderCommit}
                onTouchEnd={handleSliderCommit}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="inline"
              onClick={() => originalUrl && runCorrection(originalUrl, { exposure, shadow, contrast })}
              disabled={!originalUrl || isProcessing}
            >
              {isProcessing ? "처리 중..." : "다시 적용"}
            </Button>
            <Button
              variant="gray"
              size="inline"
              onClick={() => {
                setExposure(DEFAULT_COLOR_CORRECTION.exposure);
                setShadow(DEFAULT_COLOR_CORRECTION.shadow);
                setContrast(DEFAULT_COLOR_CORRECTION.contrast);
                if (originalUrl) runCorrection(originalUrl, DEFAULT_COLOR_CORRECTION);
              }}
            >
              기본값(35 / -21 / 12)으로 초기화
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-500">보정 실패: {error}</p>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h2 className="text-heading-1-semibold text-gray-900">
            3. 원본 vs 보정본
          </h2>
          {!originalUrl ? (
            <p className="text-sm text-gray-400">촬영하면 비교가 표시됩니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-xs text-gray-500 font-medium block">
                  원본 (필터 없음)
                </span>
                <img
                  src={originalUrl}
                  alt="원본"
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs text-gray-500 font-medium block">
                  보정본 (노출 {exposure} / 그림자 {shadow} / 대비 {contrast})
                </span>
                {correctedUrl ? (
                  <img
                    src={correctedUrl}
                    alt="보정본"
                    className="w-full rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                    {isProcessing ? "처리 중..." : "대기 중"}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
