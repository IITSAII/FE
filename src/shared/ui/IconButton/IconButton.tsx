import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center shrink-0 size-13 rounded-[6.5px] p-[11.8px] focus:outline-none disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        // +, - 버튼 (Gray/600 채우기)
        secondary: "bg-gray-600 text-white border-none",
        // 오른쪽 화살표 버튼 (Dark Green 채우기)
        primary: "bg-green-950 text-green-200 border-none",
        // 왼쪽 화살표 / 뒤로가기 버튼 (Gray 테두리 + 투명 배경)
        outline: "bg-transparent text-gray-500 border border-gray-500",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface IconButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  children?: React.ReactNode;
}

export function IconButton({
  className,
  variant,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(iconButtonVariants({ variant }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
