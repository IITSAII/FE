import pichimothanMap from "../assets/pichimothan-map.svg";
import pichimothanArrow from "../assets/pichimothan-arrow.gif";
import banjjakMap from "../assets/banjjak-map.svg";
import banjjakArrow from "../assets/banjjak-arrow.gif";
import type { PartnerLocationVariant } from "../lib/partnerMatch";

const ASSETS: Record<"pichimothan" | "banjjak", { map: string; arrow: string }> = {
  pichimothan: { map: pichimothanMap, arrow: pichimothanArrow },
  banjjak: { map: banjjakMap, arrow: banjjakArrow },
};

export interface PartnerRouteMapProps {
  variant: Extract<PartnerLocationVariant, "pichimothan" | "banjjak">;
  /** 지도 이미지의 대체 텍스트에 사용할 배정 업체명/위치 설명 */
  locationLabel: string;
}

/**
 * 정적 SVG 지도(피치못한/반짝 브랜드 컬러의 스타일라이즈된 동네 지도, 도착지 핀 포함) 위에
 * "잇, 사이"에서 출발하는 화살표 애니메이션 GIF를 겹쳐 보여준다.
 * GIF는 화살표만 투명 배경에 담겨 있고 SVG보다 세로로 더 길게 내보내져 있어(원본 파일 기준
 * 366x620 대 1608x3496 — GIF의 세로 비중이 큼), 폭 기준으로 맞추고 위쪽을 기준으로 겹친 뒤
 * 넘치는 아래쪽은 잘라낸다. 실제 화면에서 화살표가 지도 핀과 어긋나 보이면 아래 top/scale 값을
 * 조정해야 한다.
 */
export function PartnerRouteMap({ variant, locationLabel }: PartnerRouteMapProps) {
  const { map, arrow } = ASSETS[variant];

  return (
    <div className="relative w-full aspect-[366/620] overflow-hidden bg-white">
      <img
        src={map}
        alt={`${locationLabel} 위치 안내 지도`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <img
        src={arrow}
        alt=""
        className="absolute top-0 left-0 w-full h-auto"
      />
    </div>
  );
}
