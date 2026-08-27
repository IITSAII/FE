import React from "react";
import { Card } from "./Card";
import { cn } from "../../lib/utils";

export interface MissionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  className?: string;
}

/**
 * 미션 카드 컴포넌트 (Mission Card)
 * - Base Card를 합성(Composition)하여 타이틀과 미션 설명을 표시합니다.
 */
export function MissionCard({
  title,
  description,
  isSelected = false,
  isDisabled = false,
  className,
  ...props
}: MissionCardProps) {
  return (
    <Card
      isSelected={isSelected}
      isDisabled={isDisabled}
      className={cn("w-full max-w-171", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-3 text-center w-full">
        <h3 className="text-ipad-heading-3-medium text-black w-full wrap-break-word">
          {title}
        </h3>
        <p className="text-ipad-body-2-light text-gray-700 w-full wrap-break-word">
          {description}
        </p>
      </div>
    </Card>
  );
}
