import type { PartnerLocationVariant } from "../../partner-location/lib/partnerMatch";
import overnookLocationImage from "../assets/overnook-location.png";
import banjjakLocationImage from "../assets/banjjak-location.png";
import pichimothanLocationImage from "../assets/pichimothan-location.png";
import majuhadaLocationImage from "../assets/majuhada-location.png";

export interface CompanyLocationInfo {
  /** 위치보기 카드/헤더/지도 마커에 노출할 업체명 */
  name: string;
  /** 위치보기 카드 썸네일 이미지 */
  image: string;
  /** 위치 안내 문구. `naver-map` variant에서는 네이버 지도 검색어로도 사용된다. */
  location: string;
  /** 피치못한/반짝은 정적 약도, 그 외는 토스트 카드에서 네이버 지도 검색으로 바로 연결된다. */
  variant: PartnerLocationVariant;
}

/**
 * CategoryTabs id별 정적 업체 위치 정보.
 * 세션(QR) 없이 `/intro`에 진입했을 때는 배정된 제휴업체가 없으므로,
 * 현재 선택된 카테고리 탭의 업체 위치를 이 정적 데이터로 안내한다.
 * "잇, 사이"(itsai)는 실제 제휴업체가 아니므로 항목이 없다.
 */
export const COMPANY_LOCATION_INFO: Partial<
  Record<string, CompanyLocationInfo>
> = {
  pichimothan: {
    name: "피치못한",
    image: pichimothanLocationImage,
    location: "세종 조치원읍 섭골길 97 안쪽 공간",
    variant: "pichimothan",
  },
  banjjak: {
    name: "반짝",
    image: banjjakLocationImage,
    location: "세종 조치원읍 섭골길 97 중앙 테이블",
    variant: "banjjak",
  },
  overnook: {
    name: "overnook",
    image: overnookLocationImage,
    location: "섭골길 59 이편한세상아파트 근린상가 104호",
    variant: "naver-map",
  },
  majuhada: {
    name: "마주하다",
    image: majuhadaLocationImage,
    location: "세종 조치원읍 섭골길 97 중앙 테이블",
    variant: "naver-map",
  },
};
