import { api } from "../../../shared/lib/axios";

export interface SelectedPhotoInfo {
  photoId: number;
  selectOrder: number;
  imageUrl: string;
}

/** 촬영한 사진 중 4장을 최종 선택으로 저장한다. 세션당 한 번만 가능하다. */
export async function selectPhotos(
  sessionId: string,
  photoIds: number[],
  signal?: AbortSignal,
): Promise<void> {
  await api.post(
    `/sessions/${sessionId}/photos/select`,
    { photoIds },
    { signal },
  );
}

/** 최종 선택된 4장의 사진을 선택 순서대로 조회한다. */
export async function getSelectedPhotos(
  sessionId: string,
  signal?: AbortSignal,
): Promise<SelectedPhotoInfo[]> {
  const { data } = await api.get<{ photos: SelectedPhotoInfo[] }>(
    `/sessions/${sessionId}/selected-photos`,
    { signal },
  );
  return data.photos;
}
