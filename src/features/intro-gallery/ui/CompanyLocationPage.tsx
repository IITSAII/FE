import { Link } from "@tanstack/react-router";
import LeftChevronIcon from "../../../shared/assets/icons/LeftChevronIcon.svg?react";
import { NaverMap } from "../../partner-location/ui/NaverMap";
import { PartnerRouteMap } from "../../partner-location/ui/PartnerRouteMap";
import { COMPANY_LOCATION_INFO } from "../lib/companyLocationContent";

export interface CompanyLocationPageProps {
  companyId: string;
}

/**
 * 세션(QR) 없이 `/intro`에서 진입하는 위치 안내 화면.
 * 배정된 제휴업체가 없으므로 서버 조회 없이 정적 데이터(`COMPANY_LOCATION_INFO`)로 안내한다.
 */
export function CompanyLocationPage({ companyId }: CompanyLocationPageProps) {
  const info = COMPANY_LOCATION_INFO[companyId];

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[430px] mx-auto flex flex-col box-border">
        {/* 헤더: 뒤로가기 + 타이틀 */}
        <div className=" w-full flex items-center justify-between bg-iphone-background border-b border-gray-100 px-4.5 py-3">
          <Link to="/intro" aria-label="이전 화면으로 이동">
            <LeftChevronIcon className="w-6 h-6 text-gray-900" />
          </Link>
          <p className="text-iphone-heading-2-medium text-black">
            {info ? `${info.name} 위치보기` : "위치보기"}
          </p>
          <div className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="w-full flex-1 flex items-center justify-center">
          {!info ? (
            <p className="text-iphone-body-1-light text-gray-500 text-center px-6 py-20">
              업체 정보를 찾을 수 없어요.
            </p>
          ) : info.variant === "naver-map" ? (
            <div className="w-full aspect-[366/620]">
              <NaverMap address={info.address ?? ""} name={info.name} />
            </div>
          ) : (
            <PartnerRouteMap variant={info.variant} locationLabel={info.name} />
          )}
        </div>
      </main>
    </div>
  );
}
