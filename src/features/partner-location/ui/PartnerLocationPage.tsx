import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import LeftArrowIcon from "../../../shared/assets/icons/LeftArrowIcon.svg?react";
import { isApiError } from "../../../shared/lib/apiError";
import { getAssignedPartner, type AssignedPartner } from "../api/partnerApi";
import { getPartnerLocationVariant } from "../lib/partnerMatch";
import { PartnerRouteMap } from "./PartnerRouteMap";
import { NaverMap } from "./NaverMap";

export interface PartnerLocationPageProps {
  sessionId: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; partner: AssignedPartner };

/**
 * 배정된 제휴업체 위치를 안내하는 화면. 피치못한/반짝은 제공된 SVG+GIF 조합을,
 * 그 외(overnook, 마주하다)는 주소 기반 네이버 지도를 보여준다.
 */
export function PartnerLocationPage({ sessionId }: PartnerLocationPageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchPartner() {
      setState({ status: "loading" });
      try {
        const partner = await getAssignedPartner(sessionId, controller.signal);
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
  }, [sessionId]);

  const partnerName = state.status === "ready" ? state.partner.name : "";

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      <main className="w-full max-w-[430px] mx-auto flex flex-col box-border">
        {/* 헤더: 뒤로가기 + 타이틀 */}
        <div className="w-full flex items-center justify-between bg-iphone-background border-b border-gray-100 px-4.5 py-3">
          <Link
            to="/intro/$sessionId"
            params={{ sessionId }}
            aria-label="이전 화면으로 이동"
          >
            <LeftArrowIcon className="w-6 h-6 text-gray-900" />
          </Link>
          <p className="text-iphone-heading-2-medium text-black">
            {partnerName ? `${partnerName} 위치보기` : "위치보기"}
          </p>
          <div className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="w-full flex-1 flex items-center justify-center">
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
              return variant === "naver-map" ? (
                <div className="w-full aspect-[366/620]">
                  <NaverMap
                    address={state.partner.location}
                    name={state.partner.name}
                  />
                </div>
              ) : (
                <PartnerRouteMap variant={variant} />
              );
            })()}
        </div>
      </main>
    </div>
  );
}
