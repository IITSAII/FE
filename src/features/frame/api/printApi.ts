import { api } from "../../../shared/lib/axios";

export type FrameType = "DARK" | "LIGHT";
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

/** 세션의 인쇄 상태(최종 이미지, 프레임/필터, 인쇄 진행 상태)를 조회한다. */
export async function getPrintInfo(
  sessionId: string,
  signal?: AbortSignal,
): Promise<PrintInfo> {
  const { data } = await api.get<PrintInfo>(`/sessions/${sessionId}/print`, {
    signal,
  });
  return data;
}
