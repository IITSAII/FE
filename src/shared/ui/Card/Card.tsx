import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
}

/**
 * 공용 카드 프레임 컴포넌트 (Base Card Frame)
 * - 미션 카드, 인원 카드 등의 외곽 디자인(테두리, 4개 모서리 포인트)을 담당합니다.
 */
export function Card({
  children,
  className,
  isSelected = false,
  isDisabled = false,
  ...props
}: CardProps) {
  const cornerBg = isSelected ? "bg-green-500" : "bg-gray-400";

  return (
    <div
      className={cn(
        "relative w-full bg-white border border-gray-200 rounded-[4px] p-6 transition-all",
        isDisabled && "opacity-40",
        className,
      )}
      {...props}
    >
      {/* 4개 모서리 포인트 장식 */}
      <div className={cn("absolute top-0 left-0 w-6 h-6", cornerBg)} />
      <div className={cn("absolute top-0 right-0 w-6 h-6", cornerBg)} />
      <div className={cn("absolute bottom-0 left-0 w-6 h-6", cornerBg)} />
      <div className={cn("absolute bottom-0 right-0 w-6 h-6", cornerBg)} />

      {/* 카드 내부 콘텐츠 */}
      <div className="relative flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
