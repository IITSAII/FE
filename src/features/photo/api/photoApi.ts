import { api } from "../../../shared/lib/axios";

export interface PhotoInfo {
  photoId: number;
  shotNumber: number;
  imageUrl: string;
}

/**
 * 촬영한 사진 1장을 업로드한다(멀티파트, 파일 필드명 `image`).
 * `shotNumber`는 1부터 시작하며 세션당 최대 6장까지 업로드 가능하다.
 */
export async function uploadPhoto(
  sessionId: string,
  shotNumber: number,
  image: Blob,
  signal?: AbortSignal,
): Promise<PhotoInfo> {
  const formData = new FormData();
  formData.append("shotNumber", String(shotNumber));
  formData.append("image", image, `shot-${shotNumber}.png`);

  const { data } = await api.post<PhotoInfo>(
    `/sessions/${sessionId}/photos`,
    formData,
    { signal, headers: { "Content-Type": undefined } },
  );
  return data;
}

/** 세션에 업로드된 사진 목록을 촬영 순서대로 조회한다. */
export async function getPhotos(
  sessionId: string,
  signal?: AbortSignal,
): Promise<PhotoInfo[]> {
  const { data } = await api.get<{ photos: PhotoInfo[] }>(
    `/sessions/${sessionId}/photos`,
    { signal },
  );
  return data.photos;
}
