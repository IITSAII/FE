import { Link } from "@tanstack/react-router";
import { LocationToastCard } from "../../../shared/ui/LocationToastCard/LocationToastCard";
import type { AssignedPartner } from "../api/partnerApi";

export interface PartnerToastProps {
  sessionId: string;
  partner: AssignedPartner;
}

/**
 * `/intro/{sessionId}` 화면 하단에 떠 있는, 배정된 제휴업체 안내 토스트.
 * CategoryTabs에서 어떤 업체로 바꾸든 항상 sessionId에 배정된 업체의 혜택 문구를 보여준다.
 * 클릭하면 배정된 업체의 위치 보기 페이지로 이동한다.
 */
export function PartnerToast({ sessionId, partner }: PartnerToastProps) {
  return (
    <Link
      to="/intro/$sessionId/location"
      params={{ sessionId }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-[350px] z-20"
    >
      <LocationToastCard
        imageUrl={partner.logoUrl}
        name={partner.name}
        location={partner.location}
        buttonLabel={partner.couponDescription}
      />
    </Link>
  );
}
