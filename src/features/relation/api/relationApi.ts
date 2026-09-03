import { api } from "../../../shared/lib/axios";
import type { SessionStatusResponse } from "../../payment/api/paymentApi";

export type RelationshipType = "GETTING_CLOSE" | "FRIEND" | "CRUSH" | "COUPLE";

/**
 * 관계 선택 제출. `relationshipType`을 생략(null)하면 "설정 안 함"으로 저장된다.
 * 성공 시 세션이 CAPTURE 단계로 전이된다.
 */
export async function submitRelationship(
  sessionId: string,
  relationshipType: RelationshipType | null,
  signal?: AbortSignal,
): Promise<SessionStatusResponse> {
  const { data } = await api.post<SessionStatusResponse>(
    `/sessions/${sessionId}/relationship`,
    relationshipType ? { relationshipType } : {},
    { signal },
  );
  return data;
}
