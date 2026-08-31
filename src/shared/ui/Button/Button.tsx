import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-primary border-none focus:outline-none cursor-pointer text-center whitespace-nowrap",
  {
    variants: {
      variant: {
        /** 1번 버튼: 모바일 바텀 액션 (Dark Green / Black 계열, bg-green-950) */
        dark: "bg-green-950 text-white text-body-2-regular",
        /** 2번 버튼: 주요 CTA (Primary Green 계열, bg-green-500) */
        primary: "bg-green-500 text-white text-iphone-body-1-semibold",
        /** 3번 버튼: 보조/테두리 pill (Gray 계열, bg-gray-100 & text-gray-500) */
        gray: "bg-gray-100 text-gray-500 text-iphone-body-1-semibold",
        /** 4번 버튼: 포인트 pill (Dark Green 900 & Light Green 200 텍스트) */
        darkGreen: "bg-green-900 text-green-200 text-iphone-body-1-semibold",
      },
      size: {
        /** 1번, 2번 버튼 레이아웃 */
        block: "w-full min-h-10.5 py-[10.7px] px-4 rounded-[4px]",
        /** 3번, 4번 버튼 레이아웃 */
        inline: "w-auto px-[37px] py-[11px] rounded-[8px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "block",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
