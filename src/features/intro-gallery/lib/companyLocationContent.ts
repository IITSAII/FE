import type { PartnerLocationVariant } from "../../partner-location/lib/partnerMatch";

export interface CompanyLocationInfo {
  /** 위치보기 헤더 및 지도 마커에 노출할 업체명 */
  name: string;
  /** 피치못한/반짝은 정적 약도, 그 외는 네이버 지도를 사용한다. */
  variant: PartnerLocationVariant;
  /** `naver-map` variant에서 지오코딩에 사용할 주소 */
  address?: string;
}

/**
 * CategoryTabs id별 정적 업체 위치 정보.
 * 세션(QR) 없이 `/intro`에 진입했을 때는 배정된 제휴업체가 없으므로,
 * 현재 선택된 카테고리 탭의 업체 위치를 이 정적 데이터로 안내한다.
 * "잇, 사이"(itsai)는 실제 제휴업체가 아니므로 항목이 없다.
 */
export const COMPANY_LOCATION_INFO: Partial<Record<string, CompanyLocationInfo>> = {
  pichimothan: { name: "피치못한", variant: "pichimothan" },
  banjjak: { name: "반짝이는 모든 것들", variant: "banjjak" },
  overnook: {
    name: "Overnook",
    variant: "naver-map",
    address: "세종 조치원읍 섭골길 59 이편한세상아파트 근린상가 104호",
  },
  majuhada: {
    name: "마주하다",
    variant: "naver-map",
    address: "세종 조치원읍 섭골길 97 중앙 테이블",
  },
};
