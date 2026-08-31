import React from "react";
import { cn } from "../../lib/utils";

export interface CategoryTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isSelected?: boolean;
  className?: string;
}

/**
 * 개별 카테고리 탭 버튼 컴포넌트
 */
export function CategoryTab({
  label,
  isSelected = false,
  className,
  ...props
}: CategoryTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      className={cn(
        "relative flex flex-col items-center justify-center shrink-0 pb-4 px-0.5 border-b-[3px] transition-colors ease-in-out select-none outline-none cursor-pointer box-border",
        isSelected
          ? "border-black text-black text-iphone-heading-2-medium"
          : "border-transparent text-gray-400 text-iphone-heading-1-regular",
        "tracking-[-0.4px] leading-normal",
        className,
      )}
      {...props}
    >
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
