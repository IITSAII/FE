/** 인원당 가격(원). 실제 결제 금액은 서버가 세션 생성 시 확정한다. */
export const PRICE_PER_PERSON = 1500;

/** 선택 가능한 인원 수. 서버 세션 생성 API의 허용 quantity(2, 4, 6)와 같다. */
export const ALLOWED_PERSONNEL_COUNTS = [2, 4, 6];
