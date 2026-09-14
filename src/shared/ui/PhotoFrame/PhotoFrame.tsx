import React from "react";
import { cn } from "../../lib/utils";
import { QrCode } from "../QrCode/QrCode";
import Logo from "../../assets/icons/Logo/Logo.svg?react";
// 프레임 디자인 임시 변경으로 미사용 (PhotoFrame 우상단 로고 주석 처리)
// import VerticalLogo from "../../assets/icons/Logo/VerticalLogo.svg?react";
import PichimothanLogo from "../../assets/icons/Logo/PichimothanLogo.svg?react";
import MajuhadaLogo from "../../assets/icons/Logo/MajuhadaLogo.svg?react";
import OvernookLogo from "../../assets/icons/Logo/OvernookLogo.svg?react";
import SaiItdaLogo from "../../assets/icons/Logo/SaiItdaLogo.svg?react";
import ScanLabelIcon from "../../assets/icons/ScanLabelIcon.svg?react";

export type PhotoFrameVariant = "dark" | "light";

export type PhotoFrameTheme =
  | "pichimothan"
  | "majuhada"
  | "overnook"
  | "banjjak";

export type PhotoFilter = "default" | "grayscale";

export interface PhotoFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 프레임 색상 테마 ("dark" = 다크 그린/블랙, "light" = 아이보리/크림) */
  variant?: PhotoFrameVariant;
  /** 프레임 타이틀/브랜드 테마 ("pichimothan" | "majuhada" | "overnook" | "banjjak") */
  theme?: PhotoFrameTheme;
  /** 4장의 사진 이미지 URL 배열 (최대 4장) */
  photos?: (string | undefined | null)[];
  /** 메타데이터 관계 텍스트 (기본값: "Friend") */
  relationship?: string;
  /** 메타데이터 날짜 텍스트 (기본값: "2026.05.16") */
  date?: string;
  /** QR 코드 이미지 URL (선택) */
  qrCodeUrl?: string;
  /** 사진 필터 ("default" | "grayscale") */
  filter?: PhotoFilter;
  /** 추가 커스텀 스타일 클래스 */
  className?: string;
}

/*
 * 잇, 사이 네컷 사진 프레임 컴포넌트 (PhotoFrame)
 */
export function PhotoFrame({
  variant = "dark",
  theme = "pichimothan",
  photos = [],
  relationship = "Friend",
  date = "2026.05.16",
  qrCodeUrl,
  filter = "default",
  className,
  ...props
}: PhotoFrameProps) {
  // 4개의 사진 슬롯 고정
  const photoSlots = Array.from({ length: 4 }, (_, i) => photos[i] ?? null);

  // 테마별 브랜드 로고 SVG 컴포넌트 매핑
  const renderThemeLogo = () => {
    switch (theme) {
      case "pichimothan":
        return (
          <PichimothanLogo className="w-42 h-14.5 fill-current text-current" />
        );
      case "majuhada":
        return (
          <MajuhadaLogo className="w-53.25 h-11.5 fill-current text-current" />
        );
      case "overnook":
        return (
          <OvernookLogo className="w-67.5 h-11.5 fill-current text-current" />
        );
      case "banjjak":
      default:
        // TODO: 반짝 로고 추가 시 변경
        return (
          <OvernookLogo className="w-67.5 h-11.5 fill-current text-current" />
        );
    }
  };

  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "relative w-150 h-450 flex flex-col select-none overflow-hidden gap-22.5",
        isDark ? "bg-frame-dark text-white" : "bg-frame-light text-green-500",
        className,
      )}
      {...props}
    >
      {/* 상단: 4컷 사진 영역 + 우측 사이드바 레어아웃 */}
      <div className="relative flex w-full gap-4.75">
        {/* 좌측: 4개의 세로 사진 슬롯 */}
        <div className="flex flex-col gap-[6.4px] w-124 h-full">
          {photoSlots.map((photoUrl, idx) => (
            <div
              key={idx}
              className={cn(
                "w-full h-85.75 overflow-hidden flex items-center justify-center relative",
                isDark ? "bg-iphone-background" : "bg-frame-dark",
              )}
            >
              {/* photos는 촬영 시 캔버스에서 만든 data: URL이라 항상 same-origin이다.
                  crossOrigin="anonymous"를 붙이면 필요도 없을뿐더러, 일부 iOS Safari에서
                  data: URL 이미지에 이 속성이 붙었을 때 로드 자체가 실패하는 사례가 있어
                  (최종 캡처 시 사진이 빈 채로 캡처되는 원인으로 의심됨) 의도적으로 뺐다. */}
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
          ))}
        </div>

        {/* 우측 사이드바: 상단 미니 로고 + 세로 텍스트 + 하단 QR 코드 */}
        <div className="h-full flex flex-col items-center justify-between pt-5 pr-5">
          {/* 우상단 잇사이 로고 */}
          {/* <VerticalLogo className="w-16.25 h-40.25 fill-current text-current" /> */}
          <div />
          <div className="flex flex-col gap-8">
            {/* 세로 "scan the" 문구 */}
            <ScanLabelIcon />

            {/* 하단 QR 코드 박스 */}
            {qrCodeUrl ? (
              isDark ? (
                <QrCode url={qrCodeUrl} size={73} />
              ) : (
                <QrCode
                  url={qrCodeUrl}
                  backgroundColor="#F9F5ED"
                  dotsColor="#4ca858"
                  size={73}
                />
              )
            ) : (
              <div className="size-18.25 bg-black" />
            )}
          </div>
        </div>
      </div>

      {/* 하단: 브랜드 로고 & 타이틀 + 메타데이터 영역 */}
      <div className="w-full flex flex-col items-center gap-14.5 pl-10 pr-7.5">
        <div className="w-full flex flex-col gap-11.25">
          <div className="w-full h-14.5 flex flex-col justify-center">
            {/* 브랜드 로고 행 */}
            <div className="w-full flex items-center overflow-hidden gap-8.5">
              <div className="flex-1 flex gap-8.75 items-end w-full">
                {/* 메인 로고 */}
                <Logo className="shrink-0 w-32.75 h-13.5" />

                {/* 구분선 */}
                <div className="flex-1 h-4.5 flex gap-2.5">
                  <div className="h-full flex-1 flex flex-col justify-end">
                    <div
                      className={cn(
                        "w-full h-2",
                        isDark ? "bg-iphone-background" : "bg-green-500",
                      )}
                    />
                  </div>
                  <div className="h-full w-fit flex flex-col justify-start">
                    <div
                      className={cn(
                        "size-2",
                        isDark ? "bg-iphone-background" : "bg-green-500",
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* 업체 로고 */}
              {renderThemeLogo()}
            </div>
          </div>

          {/* 하단 메타데이터: Relationship & Date */}
          <div className="w-full flex flex-col gap-2 text-ipad-body-0-light pr-1.5">
            <div className="flex items-center justify-between w-full">
              <span>Relationship</span>
              <span>{relationship}</span>
            </div>
            <div className="flex items-center justify-between w-full">
              <span>Date</span>
              <span>{date}</span>
            </div>
          </div>
        </div>

        <SaiItdaLogo className="w-51.5 h-9.75" />
      </div>
    </div>
  );
}
