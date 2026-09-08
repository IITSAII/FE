import { api } from "../../../shared/lib/axios";

export type FrameType = "DARK" | "LIGHT" | "JobokPink" | "JobokDark";
export type PrintJobStatus = "QUEUED" | "PRINTING" | "DONE" | "FAILED";

export interface FrameSelectParams {
  frameType: FrameType;
  filterBw: boolean;
  filterBrightness: number;
}

export interface FrameSelectResponse {
  printJobId: number;
  frameType: FrameType;
}

export interface PrintInfo {
  finalImageUrl: string;
  frameType: FrameType;
  filterBw: boolean;
  filterBrightness: number;
  status: PrintJobStatus;
  /** 촬영 날짜 (YYYY-MM-DD) */
  capturedAt: string;
}

/** 프레임 색상/필터를 확정해 인쇄 작업(PrintJob)을 생성한다. 세션당 한 번만 가능하다. */
export async function selectFrame(
  sessionId: string,
  params: FrameSelectParams,
  signal?: AbortSignal,
): Promise<FrameSelectResponse> {
  const { data } = await api.post<FrameSelectResponse>(
    `/sessions/${sessionId}/print/frame`,
    params,
    { signal },
  );
  return data;
}

/**
 * 합성된 최종 인쇄용 이미지를 업로드한다(멀티파트, 파일 필드명 `finalImage`, JPEG/PNG만 허용).
 * 업로드 성공 시 세션이 PRINT 단계로 전이된다.
 */
export async function uploadFinalImage(
  sessionId: string,
  finalImage: Blob,
  signal?: AbortSignal,
): Promise<{ finalImageUrl: string }> {
  const formData = new FormData();
  const extension = finalImage.type === "image/png" ? "png" : "jpg";
  formData.append("finalImage", finalImage, `final-image.${extension}`);

  const { data } = await api.post<{ finalImageUrl: string }>(
    `/sessions/${sessionId}/print/final-image`,
    formData,
    { signal, headers: { "Content-Type": undefined } },
  );
  return data;
}

/**
 * 세션의 인쇄 상태(최종 이미지, 프레임/필터, 인쇄 진행 상태)를 조회한다.
 * 촬영 후 24시간이 지나면 410(`PHOTO_VIEW_EXPIRED`)이 날 수 있다.
 * @deprecated 프론트에서는 더 이상 이 sessionId 기반 조회를 사용하지 않는다
 * (QR 진입 화면은 {@link getPrintInfoByGalleryToken}을 사용). 백엔드 정리 여부는 별도 확인 필요.
 */
export async function getPrintInfo(
  sessionId: string,
  signal?: AbortSignal,
): Promise<PrintInfo> {
  const { data } = await api.get<PrintInfo>(`/sessions/${sessionId}/print`, {
    signal,
  });
  return data;
}

/**
 * galleryToken으로 세션의 인쇄 상태(최종 이미지 등)를 조회한다.
 * sessionId 기반 조회와 동일하게 촬영 후 24시간이 지나면 410(`PHOTO_VIEW_EXPIRED`)이 날 수 있다.
 * QR로 진입하는 `/intro/{galleryToken}/download` 화면에서 사용한다.
 */
export async function getPrintInfoByGalleryToken(
  galleryToken: string,
  signal?: AbortSignal,
): Promise<PrintInfo> {
  const { data } = await api.get<PrintInfo>(
    `/gallery/${galleryToken}/print`,
    { signal },
  );
  return data;
}
