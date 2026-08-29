import React from "react";
import { cn } from "../../lib/utils";
import Logo from "../../assets/icons/Logo/Logo.svg?react";
import VerticalLogo from "../../assets/icons/Logo/VerticalLogo.svg?react";
import PichimothanLogo from "../../assets/icons/Logo/PichimothanLogo.svg?react";
import MajuhadaLogo from "../../assets/icons/Logo/MajuhadaLogo.svg?react";
import OvernookLogo from "../../assets/icons/Logo/OvernookLogo.svg?react";
import SaiItdaLogo from "../../assets/icons/Logo/SaiItdaLogo.svg?react";
import ScanLabelIcon from "../../assets/icons/ScanLabelIcon.svg?react";

export type SmallPhotoFrameVariant = "dark" | "light";

export type SmallPhotoFrameTheme =
  | "pichimothan"
  | "majuhada"
  | "overnook"
  | "banjjak";

export interface SmallPhotoFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 프레임 색상 테마 ("dark" = 다크 그린/블랙, "light" = 아이보리/크림) */
  variant?: SmallPhotoFrameVariant;
  /** 프레임 타이틀/브랜드 테마 ("pichimothan" | "majuhada" | "overnook" | "banjjak") */
  theme?: SmallPhotoFrameTheme;
  /** 4장의 사진 이미지 URL 배열 (최대 4장) */
  photos?: (string | undefined | null)[];
  /** 메타데이터 관계 텍스트 (기본값: "Friend") */
  relationship?: string;
  /** 메타데이터 날짜 텍스트 (기본값: "2026.05.16") */
  date?: string;
  /** QR 코드 이미지 URL (선택) */
  qrCodeUrl?: string;
  /** 추가 커스텀 스타일 클래스 */
  className?: string;
}

/*
 * 잇, 사이 네컷 사진 프레임 컴포넌트 (SmallPhotoFrame)
 */
export function SmallPhotoFrame({
  variant = "dark",
  theme = "pichimothan",
  photos = [],
  relationship = "Friend",
  date = "2026.05.16",
  qrCodeUrl,
  className,
  ...props
}: SmallPhotoFrameProps) {
  // 4개의 사진 슬롯 고정
  const photoSlots = Array.from({ length: 4 }, (_, i) => photos[i] ?? null);

  // 테마별 브랜드 로고 SVG 컴포넌트 매핑
  const renderThemeLogo = () => {
    switch (theme) {
      case "pichimothan":
        return (
          <PichimothanLogo className="w-[40.6px] h-[13.8px] fill-current text-current" />
        );
      case "majuhada":
        return (
          <MajuhadaLogo className="w-[50.93px] h-[11.01px] fill-current text-current" />
        );
      case "overnook":
        return (
          <OvernookLogo className="w-[64.76px] h-[10.19px] fill-current text-current" />
        );
      case "banjjak":
      default:
        // TODO: 반짝 로고 추가 시 변경
        return (
          <OvernookLogo className="w-[64.76px] h-[10.19px] fill-current text-current" />
        );
    }
  };

  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "relative w-36.25 h-107.75 flex flex-col select-none overflow-hidden text-ipad-body-3-light gap-[21.36px]",
        isDark ? "bg-frame-dark text-white" : "bg-frame-light text-green-500",
        className,
      )}
      {...props}
    >
      {/* 상단: 4컷 사진 영역 + 우측 사이드바 레어아웃 */}
      <div className="relative flex w-full gap-[5.68px]">
        {/* 좌측: 4개의 세로 사진 슬롯 */}
        <div className="flex flex-col gap-[1.76px] w-[119px] h-full">
          {photoSlots.map((photoUrl, idx) => (
            <div
              key={idx}
              className={cn(
                "w-full h-[82.2px] overflow-hidden flex items-center justify-center relative",
                isDark
                  ? "bg-iphone-background"
                  : "bg-frame-dark border border-green-500 box-border",
              )}
            >
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* 우측 사이드바: 상단 미니 로고 + 세로 텍스트 + 하단 QR 코드 */}
        <div className="h-full flex flex-col items-center justify-between pt-[4.7px] pr-[4.78px]">
          {/* 우상단 잇사이 로고 */}
          <VerticalLogo className="w-[15.67px] h-[38.49px] fill-current text-current" />
          <div className="flex flex-col gap-[7.84px]">
            {/* 세로 "scan the" 문구 */}
            <ScanLabelIcon className="w-[10.32px] h-[49.37px]" />

            {/* 하단 QR 코드 박스 */}
            <div className="size-[14.47px] bg-black"></div>
          </div>
        </div>
      </div>

      {/* 하단: 브랜드 로고 & 타이틀 + 메타데이터 영역 */}
      <div className="w-full flex flex-col items-center gap-[15.01px] pl-2.25 pr-2.5">
        <div className="w-full flex flex-col gap-[10.41px]">
          <div className="w-full h-[13.81px] flex flex-col justify-center">
            {/* 브랜드 로고 행 */}
            <div className="w-full flex items-center overflow-hidden gap-1.75">
              <div className="flex-1 flex gap-2.25 items-end w-full">
                {/* 메인 로고 */}
                <Logo className="shrink-0 w-[31.61px] h-[12.84px]" />

                {/* 구분선 */}
                <div className="flex-1 h-[5.38px] flex gap-[1.65px]">
                  <div className="h-full flex-1 flex flex-col justify-end">
                    <div
                      className={cn(
                        "w-full h-0.5",
                        isDark ? "bg-iphone-background" : "bg-green-500",
                      )}
                    />
                  </div>
                  <div className="h-full w-fit flex flex-col justify-start">
                    <div
                      className={cn(
                        "size-0.5",
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
          <div className="w-full flex flex-col gap-0.5 pr-[2.17px]">
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

        <SaiItdaLogo className="w-[49.89px] h-[9.3px]" />
      </div>
    </div>
  );
}
