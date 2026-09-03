export type CategoryId =
  | "majuhada"
  | "banjjak"
  | "overnook"
  | "itsai"
  | "pichimothan";

/**
 * BE `PartnerResponse.name`은 "반짝이는 모든 것들"처럼 마케팅용 풀네임으로 내려오므로
 * `CategoryTabs`의 짧은 탭 id/라벨과 정확히 일치하지 않는다. 각 탭에 해당 브랜드명이
 * 부분 문자열로 포함되는지로 매칭한다. "itsai"(잇, 사이)는 실제 제휴업체가 아니므로 매핑이 없다.
 */
const CATEGORY_NAME_HINTS: Partial<Record<CategoryId, string>> = {
  majuhada: "마주하다",
  banjjak: "반짝",
  overnook: "overnook",
  pichimothan: "피치못한",
};

/** 현재 선택된 카테고리 탭이 배정된 제휴업체와 같은 브랜드를 가리키는지 판단한다. */
export function isCategoryMatchingPartner(
  categoryId: string,
  partnerName: string,
): boolean {
  const hint = CATEGORY_NAME_HINTS[categoryId as CategoryId];
  if (!hint) return false;
  return partnerName.includes(hint);
}

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
