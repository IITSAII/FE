import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { Button } from "../../../shared/ui/Button/Button";
import LeftArrowIcon from "../../../shared/assets/icons/LeftArrowIcon.svg?react";
import { isApiError } from "../../../shared/lib/apiError";
import { getPrintInfo } from "../../frame/api/printApi";

export interface FrameDownloadPageProps {
  sessionId: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; finalImageUrl: string };

/**
 * QR로 진입해 사진 아이콘 버튼을 눌렀을 때 보이는, 완성된 프레임 이미지를 다운로드하는 화면.
 * `GET /print`가 내려주는 `finalImageUrl` 한 장을 그대로 보여준다(프레임을 다시 조립하지 않는다).
 */
export function FrameDownloadPage({ sessionId }: FrameDownloadPageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchPrintInfo() {
      setState({ status: "loading" });
      try {
        const info = await getPrintInfo(sessionId, controller.signal);
        if (isMounted) setState({ status: "ready", finalImageUrl: info.finalImageUrl });
      } catch (err) {
        if (isApiError(err) && err.code === "CANCELED") return;
        const message =
          isApiError(err) && err.code === "FINAL_IMAGE_NOT_READY"
            ? "아직 사진 인화를 준비 중이에요. 잠시 후 다시 시도해주세요."
            : "사진을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
        if (isMounted) setState({ status: "error", message });
      }
    }

    fetchPrintInfo();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [sessionId]);

  const handleDownload = async () => {
    if (state.status !== "ready") return;
    setIsDownloading(true);

    try {
      const response = await fetch(state.finalImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `itsai-${sessionId}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("이미지 다운로드 실패, 새 탭에서 열기로 대체합니다:", err);
      window.open(state.finalImageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[430px] mx-auto px-4.5 pt-16 pb-12 flex flex-col gap-6 box-border">
        {/* 상단: 뒤로가기 + 타이틀 */}
        <div className="w-full flex items-center gap-3">
          <Link to="/intro/$sessionId" params={{ sessionId }}>
            <IconButton
              variant="outline"
              type="button"
              aria-label="이전 화면으로 이동"
            >
              <LeftArrowIcon className="w-6 h-6 text-gray-500" />
            </IconButton>
          </Link>
          <h1 className="text-iphone-heading-2-medium text-black">
            사진 저장하기
          </h1>
        </div>

        {/* 프레임 프리뷰 */}
        <div className="w-full min-h-[420px] bg-white flex items-center justify-center overflow-hidden">
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
              className="w-full h-auto object-contain"
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
      </main>
    </div>
  );
}
