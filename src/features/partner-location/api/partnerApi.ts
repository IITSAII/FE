import { api } from "../../../shared/lib/axios";

export interface AssignedPartner {
  logoUrl: string;
  name: string;
  location: string;
  couponDescription: string;
  galleryToken: string;
}

/**
 * 결제 확정(PAID) 시 세션에 랜덤 배정된 제휴업체 정보를 조회한다.
 * PAYMENT 단계에서는 아직 배정 전이라 404(`PARTNER_NOT_ASSIGNED`)가 날 수 있다.
 */
export async function getAssignedPartner(
  sessionId: string,
  signal?: AbortSignal,
): Promise<AssignedPartner> {
  const { data } = await api.get<AssignedPartner>(
    `/sessions/${sessionId}/partner`,
    { signal },
  );
  return data;
}
