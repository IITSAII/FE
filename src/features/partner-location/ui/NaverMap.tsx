import { useEffect, useRef, useState } from "react";

export interface NaverMapProps {
  /** 지도에 표시할 업체 주소 (Naver 지오코딩 조회용) */
  address: string;
  /** 업체명 (마커 인포윈도우 표시용) */
  name: string;
}

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          el: HTMLElement,
          options: Record<string, unknown>,
        ) => unknown;
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (options: Record<string, unknown>) => unknown;
        InfoWindow: new (options: Record<string, unknown>) => {
          open: (map: unknown, marker: unknown) => void;
        };
        Service: {
          geocode: (
            options: { query: string },
            callback: (status: string, response: unknown) => void,
          ) => void;
          Status: { OK: string };
        };
      };
    };
  }
}

let naverScriptPromise: Promise<void> | null = null;

function loadNaverMapsScript(clientId: string): Promise<void> {
  if (window.naver?.maps) return Promise.resolve();
  if (naverScriptPromise) return naverScriptPromise;

  naverScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("네이버 지도 스크립트 로드 실패"));
    document.head.appendChild(script);
  });

  return naverScriptPromise;
}

type MapState = "loading" | "ready" | "unavailable" | "not-found";

const naverMapSearchUrl = (query: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(query)}`;

/**
 * 주소를 지오코딩해 네이버 지도에 마커로 표시한다.
 * `VITE_NAVER_MAP_CLIENT_ID`가 없거나 로드/조회에 실패하면 네이버 지도 검색 링크로 대체한다.
 */
export function NaverMap({ address, name }: NaverMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MapState>("loading");
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setState("unavailable");
      return;
    }

    let isMounted = true;

    loadNaverMapsScript(clientId)
      .then(() => {
        if (!isMounted || !mapElementRef.current) return;
        const { naver } = window;
        if (!naver) {
          setState("unavailable");
          return;
        }

        naver.maps.Service.geocode({ query: address }, (status, response) => {
          if (!isMounted) return;

          if (status !== naver.maps.Service.Status.OK) {
            setState("not-found");
            return;
          }

          const result = response as {
            v2?: { addresses?: { x: string; y: string }[] };
          };
          const first = result.v2?.addresses?.[0];
          if (!first || !mapElementRef.current) {
            setState("not-found");
            return;
          }

          const position = new naver.maps.LatLng(
            Number(first.y),
            Number(first.x),
          );
          const map = new naver.maps.Map(mapElementRef.current, {
            center: position,
            zoom: 17,
          });
          const marker = new naver.maps.Marker({ position, map });
          const infoWindow = new naver.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;white-space:nowrap;">${name}</div>`,
          });
          infoWindow.open(map, marker);

          setState("ready");
        });
      })
      .catch(() => {
        if (isMounted) setState("unavailable");
      });

    return () => {
      isMounted = false;
    };
  }, [address, name, clientId]);

  if (state === "unavailable" || state === "not-found") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-100 px-6 text-center">
        <p className="text-iphone-body-2-regular text-gray-600">
          {state === "unavailable"
            ? "지도를 불러올 수 없어요."
            : "주소를 지도에서 찾지 못했어요."}
        </p>
        <a
          href={naverMapSearchUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-iphone-body-1-semibold text-white bg-green-500 rounded-[4px] px-4 py-2"
        >
          네이버 지도에서 보기
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-iphone-body-2-regular text-gray-500">
            지도를 불러오는 중...
          </p>
        </div>
      )}
      <div ref={mapElementRef} className="w-full h-full" />
    </div>
  );
}
