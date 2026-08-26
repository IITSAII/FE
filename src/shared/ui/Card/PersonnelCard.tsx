import React from "react";
import { Card } from "./Card";
import { cn } from "../../lib/utils";

export interface PersonnelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  count: number | string;
  price: number | string;
  className?: string;
}

/**
 * 인원 카드 컴포넌트 (Personnel Card)
 * - Base Card를 합성(Composition)하여 인원 수, 구분선, 금액 정보를 표시합니다.
 */
export function PersonnelCard({
  count,
  price,
  className,
  ...props
}: PersonnelCardProps) {
  const formattedPrice =
    typeof price === "number" ? `₩ ${price.toLocaleString()}` : price;

  return (
    <Card
      isSelected={false}
      className={cn("w-full max-w-106.25", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center w-full">
        {/* 인원 수 */}
        <div className="w-full">
          <span className="text-ipad-heading-0-medium text-black block">
            {count}
          </span>
        </div>

        {/* 금액 */}
        <div className="w-full box-border border-t border-gray-100 pt-2 px-3">
          <span className="text-ipad-body-2-light text-gray-700 block">
            {formattedPrice}
          </span>
        </div>
      </div>
    </Card>
  );
}
