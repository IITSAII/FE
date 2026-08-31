import { useLocation } from "@tanstack/react-router";
import Logo from "../../assets/icons/Logo/Logo.svg?react";

const Header = () => {
  const location = useLocation();
  const isMobileRoute = location.pathname === "/";

  return (
    <header className="fixed top-0 right-0 left-0 z-10">
      <div
        className={`w-full mx-auto flex items-center justify-between ${
          isMobileRoute
            ? "max-w-[430px] px-4.5 pt-3 pb-6"
            : "max-w-[834px] px-4.5 md:p-6"
        }`}
      >
        <Logo className="w-[59.21px] h-6 text-green-500" />
      </div>
    </header>
  );
};

export default Header;
