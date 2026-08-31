import { useLocation } from "@tanstack/react-router";

const Footer = () => {
  const location = useLocation();
  const isMobileRoute = location.pathname === "/";

  return (
    <footer className="w-full bg-green-500">
      <div
        className={`w-full mx-auto flex flex-col items-start gap-4 py-6 ${
          isMobileRoute
            ? "max-w-[430px] px-4.5"
            : "max-w-[834px] px-4.5 md:px-6"
        }`}
      >
        <p className="text-ipad-heading-4-medium text-white">
          Copyright © ItSai. All Rights Reserved
        </p>
        <div className="flex flex-col gap-2 text-iphone-body-2-regular text-ipad-background">
          <div className="flex flex-wrap items-center gap-2">
            <span>사업자등록번호</span>
            <span>595-40-01594</span>
            <span>|</span>
            <span>대표 : 장지수, 최재영</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>세종특별자치시 조치원읍 섭골길 97 1층</span>
            <span>|</span>
            <span>고객 센터 : 010-6682-1961, 010-2289-1051</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
