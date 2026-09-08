import { Link } from "@tanstack/react-router";
import { getCompanyLocationInfoByPartnerName } from "../../intro-gallery/lib/companyLocationContent";
import { LocationToastCard } from "../../../shared/ui/LocationToastCard/LocationToastCard";
import type { AssignedPartner } from "../api/partnerApi";
import { getNaverMapSearchUrl, getPartnerLocationVariant } from "../lib/partnerMatch";

export interface PartnerToastProps {
  sessionId: string;
  partner: AssignedPartner;
}

/**
 * `/intro/{sessionId}` 화면 하단에 떠 있는, 배정된 제휴업체 안내 토스트.
 * CategoryTabs에서 어떤 업체로 바꾸든 항상 sessionId에 배정된 업체의 혜택 문구를 보여준다.
 * 피치못한/반짝은 위치 보기 페이지로, 그 외(overnook, 마주하다 등)는 네이버 지도 검색으로 바로 이동한다.
 */
export function PartnerToast({ sessionId, partner }: PartnerToastProps) {
  const variant = getPartnerLocationVariant(partner.name);
  const companyInfo = getCompanyLocationInfoByPartnerName(partner.name);
  const card = (
    <LocationToastCard
      imageUrl={companyInfo?.image ?? partner.logoUrl}
      name={partner.name}
      location={partner.location}
      buttonLabel={partner.couponDescription}
      businessHours={partner.businessHours}
      isOpen={partner.open}
    />
  );

  if (variant === "naver-map") {
    return (
      <a
        href={getNaverMapSearchUrl(partner.location)}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-[350px] z-20"
      >
        {card}
      </a>
    );
  }

  return (
    <Link
      to="/intro/$sessionId/location"
      params={{ sessionId }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-[350px] z-20"
    >
      {card}
    </Link>
  );
}
