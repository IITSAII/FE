import { Link } from "@tanstack/react-router";
import MapPinIcon from "../../../shared/assets/icons/MapPinIcon.svg?react";
import type { AssignedPartner } from "../api/partnerApi";
import { isCategoryMatchingPartner } from "../lib/partnerMatch";

export interface PartnerToastProps {
  sessionId: string;
  partner: AssignedPartner;
  /** 인트로 갤러리에서 현재 선택된 카테고리 탭 id */
  selectedCategoryId: string;
}

/**
 * `/intro/{sessionId}` 화면 하단에 떠 있는, 배정된 제휴업체 안내 토스트.
 * 현재 선택된 카테고리 탭이 배정된 업체와 같으면 실제 혜택 문구를, 다르면 "위치 보기"를 버튼에 보여준다.
 * 어느 쪽이든 클릭하면 배정된 업체(선택된 탭이 아니라 항상 자신이 배정된 곳)의 위치 보기 페이지로 이동한다.
 */
export function PartnerToast({
  sessionId,
  partner,
  selectedCategoryId,
}: PartnerToastProps) {
  const isOwnPartnerSelected = isCategoryMatchingPartner(
    selectedCategoryId,
    partner.name,
  );
  const buttonLabel = isOwnPartnerSelected ? partner.couponDescription : "위치 보기";

  return (
    <Link
      to="/intro/$sessionId/location"
      params={{ sessionId }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[366px] px-4.5 z-20"
    >
      <div className="w-full flex gap-4 items-start p-4 rounded-xl border border-gray-100 bg-white/60 backdrop-blur-[6px] shadow-[0px_2px_40px_0px_rgba(0,0,0,0.1)]">
        <div className="w-20 h-25 rounded-[4px] shrink-0 overflow-hidden bg-gray-100">
          <img
            src={partner.logoUrl}
            alt={partner.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col gap-7 min-w-0">
          <div className="flex flex-col gap-1">
            <p className="text-[16px] font-semibold text-black truncate">
              {partner.name}
            </p>
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="size-3 shrink-0 text-gray-900" />
              <p className="text-[12px] text-gray-600 truncate">
                {partner.location}
              </p>
            </div>
          </div>
          <div className="w-full h-7.5 flex items-center justify-center rounded-[4px] bg-green-500">
            <p className="text-[14px] font-semibold text-white truncate px-2">
              {buttonLabel}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
