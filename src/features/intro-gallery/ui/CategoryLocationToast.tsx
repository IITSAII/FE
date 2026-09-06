import { Link } from "@tanstack/react-router";
import MapPinIcon from "../../../shared/assets/icons/MapPinIcon.svg?react";
import { COMPANY_LOCATION_INFO } from "../lib/companyLocationContent";

export interface CategoryLocationToastProps {
  /** 현재 선택된 카테고리 탭 id */
  selectedCategoryId: string;
}

/**
 * 세션(QR) 없이 `/intro`에 진입했을 때 화면 하단에 떠 있는 위치 안내 카드.
 * 배정된 제휴업체가 없으므로, 현재 선택된 카테고리 탭의 업체 위치 보기로 안내한다.
 * "잇, 사이"처럼 실제 위치 정보가 없는 탭이 선택되면 카드를 보여주지 않는다.
 */
export function CategoryLocationToast({
  selectedCategoryId,
}: CategoryLocationToastProps) {
  const info = COMPANY_LOCATION_INFO[selectedCategoryId];
  if (!info) return null;

  return (
    <Link
      to="/intro/location/$companyId"
      params={{ companyId: selectedCategoryId }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[366px] px-4.5 z-20"
    >
      <div className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-white/60 backdrop-blur-[6px] shadow-[0px_2px_40px_0px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPinIcon className="size-3 shrink-0 text-gray-900" />
          <p className="text-[14px] font-semibold text-black truncate">
            {info.name}
          </p>
        </div>
        <div className="h-7.5 px-4 flex items-center justify-center rounded-[4px] bg-green-500 shrink-0">
          <p className="text-[14px] font-semibold text-white whitespace-nowrap">
            위치 보기
          </p>
        </div>
      </div>
    </Link>
  );
}
