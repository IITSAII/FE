import React from "react";
import { cn } from "../../lib/utils";
import { QrCode } from "../QrCode/QrCode";
import type { PhotoFrameVariant, PhotoFilter } from "./PhotoFrame";
import jobokColorUrl from "../../assets/frames/jobok_color.svg";
import jobokMonoUrl from "../../assets/frames/jobok_mono.svg";

export interface JobokFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "light" = 컬러(jobok_color), "dark" = 흑백(jobok_mono) */
  variant?: PhotoFrameVariant;
  /** 4장의 사진 이미지 URL 배열 (최대 4장) */
  photos?: (string | undefined | null)[];
  /** 촬영 날짜 텍스트 (기본값: "2026.05.16") */
  date?: string;
  /** QR 코드 이미지 URL (선택) */
  qrCodeUrl?: string;
  /** 사진 필터 ("default" | "grayscale") */
  filter?: PhotoFilter;
  className?: string;
}

// 원본 SVG(600x1800) 기준 좌표. jobok_color.svg/jobok_mono.svg는 이 자리들이 실제로 투명하게
// 뚫려 있어(cutout), 사진/QR을 프레임보다 아래에 깔고 프레임 이미지를 맨 위에 겹치면
// 별도 마스킹 없이도 정확히 이 자리에 사진/QR이 그대로 노출된다.
const PHOTO_SLOTS = [
  { x: 2, y: 2, width: 492, height: 339 },
  { x: 2, y: 351, width: 492, height: 339 },
  { x: 2, y: 700, width: 492, height: 339 },
  { x: 2, y: 1049, width: 492, height: 339 },
];

const QR_SLOT = { x: 515, y: 1317, size: 73 };
const DATE_SLOT = { x: 361, y: 1688 };

/**
 * 조복 사진 프레임 컴포넌트 (JobokFrame)
 * - 사용자의 4장의 사진, QR 코드를 맨 아래에 깔고 디자이너가 제공한 SVG 프레임(컬러/흑백)을
 *   그 위에 겹쳐, 프레임 아트(테두리·캐릭터 장식 등)가 사진 경계를 자연스럽게 덮도록 한다.
 * - 날짜 텍스트는 프레임 그림(복숭아 캐릭터) 위에 그려지므로 프레임보다 더 위에 둔다.
 */
export function JobokFrame({
  variant = "light",
  photos = [],
  date = "2026.05.16",
  qrCodeUrl,
  filter = "default",
  className,
  ...props
}: JobokFrameProps) {
  const photoSlots = Array.from({ length: 4 }, (_, i) => photos[i] ?? null);
  const isMono = variant === "dark";
  const frameUrl = isMono ? jobokMonoUrl : jobokColorUrl;
  const textColor = isMono ? "#000000" : "#3D1808";
  const qrDotsColor = isMono ? "#000000" : "#3D1808";
  const qrBackgroundColor = isMono ? "#FFFFFF" : "#FFBEBE";

  return (
    <div
      className={cn("relative w-150 h-450 select-none overflow-hidden", className)}
      {...props}
    >
      {photoSlots.map((photoUrl, idx) => {
        const slot = PHOTO_SLOTS[idx];
        return (
          <div
            key={idx}
            className="absolute overflow-hidden flex items-center justify-center bg-[#F5F5F5]"
            style={{
              left: slot.x,
              top: slot.y,
              width: slot.width,
              height: slot.height,
            }}
          >
            {/* photos는 촬영 시 캔버스에서 만든 data: URL이라 항상 same-origin이다.
                crossOrigin="anonymous"를 붙이면 필요도 없을뿐더러, 일부 iOS Safari에서
                data: URL 이미지에 이 속성이 붙었을 때 로드 자체가 실패하는 사례가 있어
                (최종 캡처 시 사진이 빈 채로 캡처되는 원인으로 의심됨) 의도적으로 뺐다.
                프레임 SVG(frameUrl)는 실제 별도 오리진 정적 자산이라 crossOrigin이 계속 필요하다. */}
            {photoUrl && (
              <img
                src={photoUrl}
                alt={`Photo ${idx + 1}`}
                className={cn(
                  "w-full h-full object-cover",
                  filter === "grayscale" && "grayscale",
                )}
              />
            )}
          </div>
        );
      })}

      <div
        className="absolute"
        style={{ left: QR_SLOT.x, top: QR_SLOT.y, width: QR_SLOT.size, height: QR_SLOT.size }}
      >
        {qrCodeUrl && (
          <QrCode
            url={qrCodeUrl}
            size={QR_SLOT.size}
            dotsColor={qrDotsColor}
            backgroundColor={qrBackgroundColor}
            className="size-full"
          />
        )}
      </div>

      {/* 프레임 SVG: 사진/QR 위에 겹친다. 사진/QR 슬롯 자리는 SVG 자체에서 투명하게 뚫려 있다.
          사진 슬롯들과 동일하게 crossOrigin을 지정해야 한다 — 없으면 정적 자산이 별도
          오리진(CDN 등)에서 서빙되는 배포 환경에서 캔버스가 오염되어(tainted canvas)
          html-to-image의 toBlob 캡처가 통째로 실패할 수 있다(LoadingStep 참고). */}
      <img
        src={frameUrl}
        alt=""
        draggable={false}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div
        className="absolute flex items-baseline gap-3 font-primary font-semibold whitespace-nowrap"
        style={{ left: DATE_SLOT.x, top: DATE_SLOT.y, color: textColor, fontSize: 18 }}
      >
        <span>Date</span>
        <span>{date}</span>
      </div>
    </div>
  );
}
