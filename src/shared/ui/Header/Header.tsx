import { Link, useLocation } from "@tanstack/react-router";
import Logo from "../../assets/icons/Logo/Logo.svg?react";
import ImageIcon from "../../assets/icons/ImageIcon.svg?react";

const Header = () => {
  const location = useLocation();
  const isMobileRoute = location.pathname === "/intro";

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
        {isMobileRoute && <ImageIcon className="w-6 h-6 text-gray-900" />}
      </div>
    </header>
  );
};

export default Header;
