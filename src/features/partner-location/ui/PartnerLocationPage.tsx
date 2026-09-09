import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import LeftChevronIcon from "../../../shared/assets/icons/LeftChevronIcon.svg?react";
import { isApiError } from "../../../shared/lib/apiError";
import {
  getAssignedPartnerByGalleryToken,
  type AssignedPartner,
} from "../api/partnerApi";
import { getPartnerLocationVariant } from "../lib/partnerMatch";
import { PartnerRouteMap } from "./PartnerRouteMap";

export interface PartnerLocationPageProps {
  galleryToken: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; partner: AssignedPartner };

/**
 * 배정된 제휴업체 위치를 안내하는 화면. 피치못한/반짝의 위치 보기 전용 페이지로,
 * 그 외(overnook, 마주하다)는 토스트 카드에서 바로 네이버 지도 검색으로 연결되어 이 페이지로 오지 않는다.
 */
export function PartnerLocationPage({
  galleryToken,
}: PartnerLocationPageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchPartner() {
      setState({ status: "loading" });
      try {
        const partner = await getAssignedPartnerByGalleryToken(
          galleryToken,
          controller.signal,
        );
        if (isMounted) setState({ status: "ready", partner });
      } catch (err) {
        if (isApiError(err) && err.code === "CANCELED") return;
        if (isMounted) {
          setState({
            status: "error",
            message: "제휴업체 정보를 불러오지 못했어요.",
          });
        }
      }
    }

    fetchPartner();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [galleryToken]);

  const partnerName = state.status === "ready" ? state.partner.name : "";

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[430px] mx-auto gap-6 flex flex-col box-border">
        {/* 헤더: 뒤로가기 + 타이틀 */}
        <div className="w-full flex items-center justify-center relative bg-iphone-background border-b border-gray-100 py-3">
          <Link
            to="/intro/$galleryToken"
            params={{ galleryToken }}
            aria-label="이전 화면으로 이동"
            className="absolute left-4.5"
          >
            <LeftChevronIcon className="w-6 h-6 text-gray-900" />
          </Link>
          <p className="text-iphone-heading-1-medium text-black leading-normal tracking-[0.4px]">
            {partnerName ? `${partnerName} 위치보기` : "위치보기"}
          </p>
          <div className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="w-full flex-1 flex items-center justify-center px-4.5">
          {state.status === "loading" && (
            <p className="text-iphone-body-1-light text-gray-500 py-20">
              불러오는 중...
            </p>
          )}
          {state.status === "error" && (
            <p className="text-iphone-body-1-light text-gray-500 text-center px-6 py-20">
              {state.message}
            </p>
          )}
          {state.status === "ready" &&
            (() => {
              const variant = getPartnerLocationVariant(state.partner.name);
              if (variant === "naver-map") {
                return (
                  <p className="text-iphone-body-1-light text-gray-500 text-center px-6 py-20">
                    위치 정보를 찾을 수 없어요.
                  </p>
                );
              }
              return (
                <PartnerRouteMap
                  variant={variant}
                  locationLabel={`${state.partner.name} (${state.partner.location})`}
                />
              );
            })()}
        </div>
      </main>
    </div>
  );
}
