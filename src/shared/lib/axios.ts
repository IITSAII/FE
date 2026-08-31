import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ApiError } from "./apiError";
import type { CommonResponse } from "../types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  console.error(
    "VITE_API_BASE_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.",
  );
}

export const api = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (import.meta.env.DEV) {
    console.debug(
      `[api] ${config.method?.toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""}`,
    );
  }
  return config;
});

/**
 * 응답 인터셉터
 * - 성공 응답은 `CommonResponse`의 껍데기를 벗겨 `data`만 남긴다.
 *   (`api.post<T>()`의 `response.data`가 곧 `T`가 된다.)
 * - HTTP 200이지만 `success: false`인 응답도 실패로 취급한다.
 * - 모든 실패는 `ApiError`로 정규화해서 reject 한다.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;

    if (isCommonResponse(body)) {
      if (!body.success) {
        throw new ApiError(
          body.error?.message ?? "요청 처리에 실패했습니다.",
          body.error?.code ?? "UNKNOWN",
          response.status,
        );
      }
      response.data = body.data;
    }

    return response;
  },
  (error: unknown) => Promise.reject(toApiError(error)),
);

function isCommonResponse(body: unknown): body is CommonResponse<unknown> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    typeof (body as CommonResponse<unknown>).success === "boolean"
  );
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError("요청이 취소되었습니다.", "CANCELED");
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return new ApiError(
        "요청 시간이 초과되었습니다. 다시 시도해주세요.",
        "TIMEOUT",
      );
    }

    const response = error.response;

    if (!response) {
      return new ApiError(
        "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
        "NETWORK_ERROR",
      );
    }

    const body = response.data as CommonResponse<unknown> | undefined;

    if (body?.error) {
      return new ApiError(body.error.message, body.error.code, response.status);
    }

    return new ApiError(
      response.status >= 500
        ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        : "요청 처리 중 오류가 발생했습니다.",
      "UNKNOWN",
      response.status,
    );
  }

  return new ApiError(
    error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    "UNKNOWN",
  );
}
