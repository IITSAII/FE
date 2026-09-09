import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../../../shared/ui/Button/Button";
import LeftChevronIcon from "../../../shared/assets/icons/LeftChevronIcon.svg?react";
import { isApiError } from "../../../shared/lib/apiError";
import { getPrintInfoByGalleryToken } from "../../frame/api/printApi";

export interface FrameDownloadPageProps {
  galleryToken: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; finalImageUrl: string; capturedAt: string };

/** ISO 날짜 문자열("YYYY-MM-DD")을 "YYYY. MM. DD" 형식으로 변환한다. */
function formatCapturedAt(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${year}. ${month}. ${day}`;
}

/** 프레임 확정 직후엔 최종 이미지 업로드가 아직 끝나지 않아 400(PRINT400_5)이 날 수 있어 재시도한다. */
const PRINT_INFO_RETRY_DELAY_MS = 2000;
const PRINT_INFO_MAX_RETRIES = 5;

/**
 * QR로 진입해 사진 아이콘 버튼을 눌렀을 때 보이는, 완성된 프레임 이미지를 다운로드하는 화면.
 * `GET /print`가 내려주는 `finalImageUrl` 한 장을 그대로 보여준다(프레임을 다시 조립하지 않는다).
 */
export function FrameDownloadPage({ galleryToken }: FrameDownloadPageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    function fetchPrintInfo(attempt: number) {
      if (attempt === 0) setState({ status: "loading" });

      getPrintInfoByGalleryToken(galleryToken, controller.signal)
        .then((info) => {
          if (isMounted)
            setState({
              status: "ready",
              finalImageUrl: info.finalImageUrl,
              capturedAt: info.capturedAt,
            });
        })
        .catch((err) => {
          if (isApiError(err) && err.code === "CANCELED") return;

          if (
            isMounted &&
            isApiError(err) &&
            err.code === "PRINT400_5" &&
            attempt < PRINT_INFO_MAX_RETRIES
          ) {
            retryTimer = setTimeout(
              () => fetchPrintInfo(attempt + 1),
              PRINT_INFO_RETRY_DELAY_MS,
            );
            return;
          }

          // 촬영 후 24시간이 지나 사진 열람 기한이 만료된 경우(410 PHOTO_VIEW_EXPIRED)를
          // 그 외 실패와 구분해서 보여준다.
          const message =
            isApiError(err) && err.code === "PHOTO_VIEW_EXPIRED"
              ? "사진 열람 기한(촬영 후 24시간)이 지나 더 이상 볼 수 없어요."
              : isApiError(err) && err.code === "PRINT400_5"
                ? "아직 사진 인화를 준비 중이에요. 잠시 후 다시 시도해주세요."
                : "사진을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
          if (isMounted) setState({ status: "error", message });
        });
    }

    fetchPrintInfo(0);

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      controller.abort();
    };
  }, [galleryToken]);

  const handleDownload = async () => {
    if (state.status !== "ready") return;
    setIsDownloading(true);

    try {
      const response = await fetch(state.finalImageUrl);
      if (!response.ok) {
        throw new Error(`이미지 요청 실패 (status: ${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      // 파일명이 매번 같으면 같은 페이지에서 재다운로드 시 iOS Safari가 "이미 받은 파일"로
      // 인식해 아무 피드백 없이 무시하는 경우가 있어, 다운로드마다 파일명을 다르게 만든다.
      anchor.download = `itsai-${galleryToken}-${Date.now()}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // 브라우저가 blob을 읽기 시작할 시간을 준 뒤 해제한다(즉시 해제 시 다운로드가 끊길 수 있음).
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error("이미지 다운로드 실패, 새 탭에서 열기로 대체합니다:", err);
      window.open(state.finalImageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[430px] mx-auto px-4.5 pb-12 gap-[105.68px] flex flex-col box-border">
        {/* 상단: 뒤로가기 + 타이틀 */}
        <div className="w-full flex items-center justify-center relative py-3 border-b border-gray-100">
          <Link
            to="/intro/$galleryToken"
            params={{ galleryToken }}
            className="absolute left-0"
          >
            <LeftChevronIcon className="w-6 h-6 text-gray-500" />
          </Link>
          <h1 className="text-iphone-heading-1-medium text-black leading-normal tracking-[0.4px]">
            사진 저장하기
          </h1>
        </div>

        <div className="w-full flex flex-col gap-4">
          <span className="text-iphone-body-1-regular text-black">
            {state.status === "ready" ? formatCapturedAt(state.capturedAt) : ""}
          </span>

          <div className="w-full flex flex-col gap-9">
            {/* 프레임 프리뷰 */}
            <div className="w-full min-h-[500px] bg-white flex items-center justify-center overflow-hidden">
              {state.status === "loading" && (
                <p className="text-iphone-body-1-light text-gray-500">
                  불러오는 중...
                </p>
              )}
              {state.status === "error" && (
                <p className="text-iphone-body-1-light text-gray-500 text-center px-6">
                  {state.message}
                </p>
              )}
              {state.status === "ready" && (
                <img
                  src={state.finalImageUrl}
                  alt="완성된 네컷 사진 프레임"
                  className="object-contain w-[146.627px] h-[437px]"
                />
              )}
            </div>

            {/* 다운로드 버튼 */}
            <Button
              variant="dark"
              size="block"
              onClick={handleDownload}
              disabled={state.status !== "ready" || isDownloading}
            >
              {isDownloading ? "다운로드 중..." : "Download"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
