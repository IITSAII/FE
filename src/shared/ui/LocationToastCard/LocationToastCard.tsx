import CalendarIcon from "../../assets/icons/CalendarIcon.svg?react";
import MapPinIcon from "../../assets/icons/MapPinIcon.svg?react";

export interface LocationToastCardProps {
  imageUrl: string;
  name: string;
  location: string;
  buttonLabel: string;
  /** 영업 시간 문구 (예: "Mon – Thu. PM 14:00 ~ 24:00"). 없으면 영업 시간 행을 표시하지 않는다. */
  businessHours?: string;
  /** 현재 시각 기준 영업 중 여부. businessHours가 있을 때만 사용된다. */
  isOpen?: boolean;
}

/**
 * 화면 하단에 떠 있는 업체 위치 안내 카드의 공용 UI.
 * 배정 업체(PartnerToast)와 정적 업체(CategoryLocationToast) 양쪽에서 재사용된다.
 */
export function LocationToastCard({
  imageUrl,
  name,
  location,
  buttonLabel,
  businessHours,
  isOpen,
}: LocationToastCardProps) {
  return (
    <div className="w-full flex gap-4 items-start p-4 rounded-xl box-border border border-gray-100 bg-white shadow-[0px_2px_40px_0px_rgba(0,0,0,0.1)]">
      <div className="w-20 min-h-25 rounded-[4px] shrink-0 self-stretch overflow-hidden bg-gray-100">
        <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 flex flex-col gap-7 min-w-0 min-h-25">
        <div className="flex flex-col">
          <p className="text-heading-2-medium font-semibold h-6 text-black truncate">
            {name}
          </p>
          <div className="flex flex-col items-start w-full">
            <div className="flex items-center gap-1.5 w-full min-w-0">
              <MapPinIcon className="size-3 shrink-0 text-gray-900" />
              <p className="flex-1 min-w-0 text-ipad-body-3-medium font-normal h-4.5 tracking-[-0.3px] text-gray-600 truncate">
                {location}
              </p>
            </div>
            {businessHours && (
              <div className="flex items-center gap-1.5 w-full min-w-0">
                <CalendarIcon className="size-3 shrink-0 text-gray-900" />
                <p className="flex-1 min-w-0 text-ipad-body-3-medium font-normal h-4.5 tracking-[-0.3px] text-gray-600 truncate">
                  {isOpen ? "영업 중" : "영업 종료"} · {businessHours}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="w-55.5 h-7.5 flex items-center justify-center rounded-[4px] bg-green-500">
          <p className="text-iphone-body-1-semibold text-white truncate px-2 tracking-[-0.35px]">
            {buttonLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
