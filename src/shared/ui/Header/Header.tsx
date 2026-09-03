import { Link, useLocation, useParams } from "@tanstack/react-router";
import Logo from "../../assets/icons/Logo/Logo.svg?react";
import ImageIcon from "../../assets/icons/ImageIcon.svg?react";

const Header = () => {
  const location = useLocation();
  const isMobileRoute = location.pathname.startsWith("/intro");
  const isDownloadRoute = location.pathname.endsWith("/download");
  const { sessionId } = useParams({ strict: false });

  // sessionId가 있는 `/intro/{sessionId}`(QR 진입)에서만 사진 아이콘 버튼을 노출한다.
  // 다운로드 페이지 자신에서는 노출하지 않는다.
  const showGalleryButton = Boolean(sessionId) && !isDownloadRoute;

  return (
    <header className="fixed top-0 right-0 left-0 z-10">
      <div
        className={`w-full mx-auto flex items-center justify-between ${
          isMobileRoute
            ? "max-w-[430px] px-4.5 pt-3 pb-6"
            : "max-w-[834px] px-4.5 md:p-6"
        }`}
      >
        <Link to="/" aria-label="첫 페이지로 돌아가기">
          <Logo className="w-[59.21px] h-6 text-green-500" />
        </Link>
        {showGalleryButton && (
          <Link
            to="/intro/$sessionId/download"
            params={{ sessionId: sessionId as string }}
            aria-label="촬영한 프레임 다운로드하기"
          >
            <ImageIcon className="w-6 h-6 text-gray-900" />
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
