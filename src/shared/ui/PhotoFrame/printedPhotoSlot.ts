/**
 * 프레임에 실제로 인화되는 사진 한 칸의 크기(프레임 원본 600x1800 기준 px).
 * JobokFrame의 사진 슬롯과 PhotoFrame의 사진 슬롯(w-124 h-85.75)이 모두 이 크기이며,
 * 촬영 화면(PhotoStep)의 "인화 영역" 가이드라인도 이 비율을 기준으로 계산한다.
 */
export const PRINTED_PHOTO_SLOT = { width: 496, height: 343 } as const;

/** 인화되는 사진의 가로/세로 비율 (가로로 긴 약 1.45:1). */
export const PRINTED_PHOTO_ASPECT_RATIO =
  PRINTED_PHOTO_SLOT.width / PRINTED_PHOTO_SLOT.height;
