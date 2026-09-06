import { Link } from "@tanstack/react-router";
import { LocationToastCard } from "../../../shared/ui/LocationToastCard/LocationToastCard";
import { getNaverMapSearchUrl } from "../../partner-location/lib/partnerMatch";
import { COMPANY_LOCATION_INFO } from "../lib/companyLocationContent";

export interface CategoryLocationToastProps {
  /** 현재 선택된 카테고리 탭 id */
  selectedCategoryId: string;
}

/**
 * 세션(QR) 없이 `/intro`에 진입했을 때 화면 하단에 떠 있는 위치 안내 카드.
 * 배정된 제휴업체가 없으므로 혜택 문구 대신 항상 "위치 보기"를 보여준다.
 * 피치못한/반짝은 위치 보기 페이지로, 그 외(overnook, 마주하다 등)는 네이버 지도 검색으로 바로 이동한다.
 * "잇, 사이"처럼 실제 위치 정보가 없는 탭이 선택되면 카드를 보여주지 않는다.
 */
export function CategoryLocationToast({
  selectedCategoryId,
}: CategoryLocationToastProps) {
  const info = COMPANY_LOCATION_INFO[selectedCategoryId];
  if (!info) return null;

  const card = (
    <LocationToastCard
      imageUrl={info.image}
      name={info.name}
      location={info.location}
      buttonLabel="위치 보기"
    />
  );

  if (info.variant === "naver-map") {
    return (
      <a
        href={getNaverMapSearchUrl(info.location)}
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
      to="/intro/location/$companyId"
      params={{ companyId: selectedCategoryId }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-[350px] z-20"
    >
      {card}
    </Link>
  );
}
