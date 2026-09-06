export type PartnerLocationVariant = "pichimothan" | "banjjak" | "naver-map";

/**
 * 위치 보기 페이지의 표현 방식을 결정한다.
 * - 피치못한/반짝: 제공된 SVG 배경 + GIF 화살표 애니메이션 조합
 * - 그 외(overnook, 마주하다 등): 주소 기반 네이버 지도 연동
 */
export function getPartnerLocationVariant(
  partnerName: string,
): PartnerLocationVariant {
  if (partnerName.includes("피치못한")) return "pichimothan";
  if (partnerName.includes("반짝")) return "banjjak";
  return "naver-map";
}

/** 주소로 네이버 지도 검색 페이지 URL을 만든다. */
export function getNaverMapSearchUrl(address: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(address)}`;
}
