import React from "react";
import { cn } from "../../lib/utils";
import { CategoryTab } from "./CategoryTab";

export interface CategoryTabItem {
  id: string;
  name: string;
}

export interface CategoryTabsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  /** 카테고리 탭 목록 */
  categories: CategoryTabItem[];
  /** 현재 선택된 카테고리 탭 id */
  selectedId: string;
  /** 카테고리 탭 선택 시 실행되는 콜백 */
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

/**
 * 카테고리 탭 선택 컴포넌트 (CategoryTabs)
 * - 카테고리가 더 늘어나도 가로 스크롤(overflow-x-auto)을 통해 무제한으로 대응 가능
 */
export function CategoryTabs({
  categories,
  selectedId,
  onSelectCategory,
  className,
  ...props
}: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-4 pt-3 px-4.5 overflow-x-auto scrollbar-none",
        className,
      )}
      {...props}
    >
      {categories.map((category) => (
        <CategoryTab
          key={category.id}
          label={category.name}
          isSelected={category.id === selectedId}
          onClick={() => {
            if (onSelectCategory) {
              onSelectCategory(category.id);
            }
          }}
        />
      ))}
    </div>
  );
}
