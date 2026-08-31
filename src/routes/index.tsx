import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CategoryTabs,
  type CategoryTabItem,
} from "../shared/ui/CategoryTabs/CategoryTabs";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const CATEGORIES: CategoryTabItem[] = [
  { id: "majuhada", name: "마주하다" },
  { id: "banjjak", name: "반짝" },
  { id: "overnook", name: "overnook" },
  { id: "itsai", name: "잇, 사이" },
  { id: "pichimothan", name: "피치못한" },
];

function IndexPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("overnook");

  return (
    <div className="w-full min-h-screen bg-iphone-background font-primary flex flex-col items-center">
      {/* 데스크톱 등 대형 화면 접근 시에도 모바일 너비(max-w-[430px])로 중앙 정렬 */}
      <main className="w-full max-w-[430px] mx-auto px-4.5 pt-16 pb-12 flex flex-col gap-4 box-border">
        {/* 카테고리 탭 영역 */}
        <CategoryTabs
          categories={CATEGORIES}
          selectedId={selectedCategoryId}
          onSelectCategory={(id) => setSelectedCategoryId(id)}
          className="px-0 pt-3"
        />

        {/* 빈 카드 템플릿 영역 */}
        <div className="w-full bg-white min-h-[480px] p-6 overflow-hidden" />
      </main>
    </div>
  );
}
