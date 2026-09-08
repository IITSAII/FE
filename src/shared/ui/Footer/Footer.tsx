import { Link, useLocation } from "@tanstack/react-router";

const Footer = () => {
  const location = useLocation();
  const isMobileRoute = location.pathname === "/";
  const isRefundPolicyRoute = location.pathname === "/refund-policy";

  // 환불 정책 페이지는 자체 상단바만 있는 단독 화면이므로 전역 Footer를 노출하지 않는다.
  if (isRefundPolicyRoute) return null;

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
        <div className="flex flex-col gap-3 w-full">
          <p className="text-heading-1-semibold text-ipad-background">
            잇, 사이
          </p>
          <div className="flex flex-col gap-2 text-iphone-body-2-regular text-ipad-background">
            <div className="flex flex-wrap items-center gap-2">
              <span>사업자등록번호</span>
              <span>595-40-01594</span>
              <span>|</span>
              <span>대표 : 장지수</span>
              <span>|</span>
              <span>세종특별자치시 조치원읍 섭골길 97</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/refund-policy" className="text-iphone-body-1-semibold">
                환불 정책
              </Link>
              <span>|</span>
              <span>고객 센터 : 010-6682-1961, 010-2289-1051</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
