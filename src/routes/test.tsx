import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../shared/ui/Button/Button";
import { Card } from "../shared/ui/Card/Card";
import { MissionCard } from "../shared/ui/Card/MissionCard";
import { PersonnelCard } from "../shared/ui/Card/PersonnelCard";
import { CategoryTabs } from "../shared/ui/CategoryTabs/CategoryTabs";
import { CategoryTab } from "../shared/ui/CategoryTabs/CategoryTab";
import { IconButton } from "../shared/ui/IconButton/IconButton";
import { Modal } from "../shared/ui/Modal/Modal";
import { PhotoFrame } from "../shared/ui/PhotoFrame/PhotoFrame";
import { useModal } from "../shared/hooks/useModal";
import PlusIcon from "../shared/assets/icons/PlusIcon.svg?react";
import MinusIcon from "../shared/assets/icons/MinusIcon.svg?react";
import RightArrowIcon from "../shared/assets/icons/RightArrowIcon.svg?react";
import LeftArrowIcon from "../shared/assets/icons/LeftArrowIcon.svg?react";
import ExclamationIcon from "../shared/assets/icons/ExclamationIcon.svg?react";

export const Route = createFileRoute("/test")({
  component: SharedUITestPage,
});

function SharedUITestPage() {
  // 카테고리 탭 목록 (사용자 설정 명칭 유지)
  const [categories] = useState([
    { id: "odd", name: "오드" },
    { id: "itsai", name: "잇, 사이" },
    { id: "pichimothan", name: "피치못한" },
    { id: "majuhada", name: "마주하다" },
    { id: "banjjak", name: "반짝" },
  ]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("odd");

  // MissionCard 토글 테스트 상태
  const [isInteractiveMissionSelected, setIsInteractiveMissionSelected] =
    useState(false);

  // PersonnelCard 카운터 대화형 테스트 상태
  const [personnelCount, setPersonnelCount] = useState(2);
  const pricePerPerson = 1500;

  // Modal 훅 상태들
  const defaultModal = useModal();
  const noticeModal = useModal();
  const customBodyModal = useModal();

  // 중첩 모달 인라인 onClose 재렌더링 회귀 테스트 상태
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [parentRerenderCount, setParentRerenderCount] = useState(0);

  return (
    <div className="min-h-screen bg-iphone-background p-6 md:p-12 font-primary text-gray-900">
      <div className="max-w-4xl mx-auto space-y-14">
        {/* 헤더 */}
        <header className="border-b border-gray-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-ipad-heading-1-medium text-gray-900">
              🧪 공용 UI 컴포넌트 전체 상태 테스트 페이지
            </h1>
            <p className="text-iphone-body-2-regular text-gray-600 mt-1">
              <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">
                src/shared/ui
              </code>
              의 모든 컴포넌트와 가능한 모든 상태(Variants, States, Disabled 등)를 시각적으로 확인합니다.
            </p>
          </div>
          <Link
            to="/"
            className="text-iphone-body-1-semibold text-green-500 hover:text-green-600 underline"
          >
            메인으로 돌아가기 &rarr;
          </Link>
        </header>

        {/* 1. CategoryTabs 컴포넌트 및 개별 CategoryTab 상태 */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
          <h2 className="text-heading-1-semibold text-gray-900 border-b border-gray-100 pb-2">
            1. CategoryTabs (카테고리 탭 컴포넌트)
          </h2>

          {/* 개별 탭 상태 확인 */}
          <div className="space-y-3">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              CategoryTab 개별 상태 (Unselected vs Selected)
            </h3>
            <div className="flex items-center gap-4 bg-iphone-background p-4 rounded-lg">
              <div className="flex flex-col items-center gap-1">
                <CategoryTab label="미선택 탭" isSelected={false} />
                <span className="text-iphone-body-2-regular text-gray-500 text-xs">
                  isSelected=false
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CategoryTab label="선택된 탭" isSelected={true} />
                <span className="text-iphone-body-2-regular text-gray-500 text-xs">
                  isSelected=true
                </span>
              </div>
            </div>
          </div>

          {/* 대화형 카테고리 탭 목록 (유저 정의 카테고리 목록) */}
          <div className="space-y-3">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              대화형 CategoryTabs 목록 (클릭하여 전환)
            </h3>
            <div className="bg-iphone-background p-4 rounded-lg">
              <CategoryTabs
                categories={categories}
                selectedId={selectedCategoryId}
                onSelectCategory={(id: string) => setSelectedCategoryId(id)}
              />
            </div>
            <p className="text-iphone-body-2-regular text-gray-700">
              현재 선택된 카테고리 ID:{" "}
              <span className="text-iphone-body-1-semibold text-green-500">
                {selectedCategoryId}
              </span>
            </p>
          </div>
        </section>

        {/* 2. Button 컴포넌트 (모든 Variants, Sizes, Disabled 상태) */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-8">
          <h2 className="text-heading-1-semibold text-gray-900 border-b border-gray-100 pb-2">
            2. Button (모든 Variant & Size & Disabled 상태)
          </h2>

          {/* Inline Size 상태별 */}
          <div className="space-y-4">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              Inline Size (`size="inline"`) - Variants별 활성 & 비활성 상태
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary (Green 500) */}
              <div className="p-4 border rounded-lg space-y-2">
                <span className="text-xs text-gray-500 font-semibold block">
                  variant="primary" (Green 500)
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="primary" size="inline">
                    Primary
                  </Button>
                  <Button variant="primary" size="inline" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              {/* Dark (Green 950) */}
              <div className="p-4 border rounded-lg space-y-2">
                <span className="text-xs text-gray-500 font-semibold block">
                  variant="dark" (Green 950)
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="dark" size="inline">
                    Dark
                  </Button>
                  <Button variant="dark" size="inline" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              {/* Gray (Gray 100) */}
              <div className="p-4 border rounded-lg space-y-2">
                <span className="text-xs text-gray-500 font-semibold block">
                  variant="gray" (Gray 100)
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="gray" size="inline">
                    Gray
                  </Button>
                  <Button variant="gray" size="inline" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              {/* DarkGreen (Green 900) */}
              <div className="p-4 border rounded-lg space-y-2">
                <span className="text-xs text-gray-500 font-semibold block">
                  variant="darkGreen" (Green 900)
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="darkGreen" size="inline">
                    DarkGreen
                  </Button>
                  <Button variant="darkGreen" size="inline" disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Block Size 상태별 */}
          <div className="space-y-4">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              Block Size (`size="block"`, `w-full`) - Variants별 상태
            </h3>
            <div className="space-y-3 max-w-xl">
              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Primary Block (Green 500)
                </span>
                <Button variant="primary" size="block">
                  Primary Block Button
                </Button>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Dark Block (Green 950)
                </span>
                <Button variant="dark" size="block">
                  Dark Block Button
                </Button>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Disabled Block Button
                </span>
                <Button variant="primary" size="block" disabled>
                  Disabled Block Button
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. IconButton 컴포넌트 (모든 Variant & Disabled 상태) */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
          <h2 className="text-heading-1-semibold text-gray-900 border-b border-gray-100 pb-2">
            3. IconButton (모든 Variant & Disabled 상태)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Primary Variant (Right Arrow / Next) */}
            <div className="p-4 border rounded-lg space-y-3 text-center">
              <span className="text-xs text-gray-500 font-semibold block">
                variant="primary" (Dark Green)
              </span>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <IconButton variant="primary">
                    <RightArrowIcon className="w-8 h-8 text-green-200" />
                  </IconButton>
                  <span className="text-xs text-gray-500">Enabled</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconButton variant="primary" disabled>
                    <RightArrowIcon className="w-8 h-8 text-green-200" />
                  </IconButton>
                  <span className="text-xs text-gray-500">Disabled</span>
                </div>
              </div>
            </div>

            {/* Secondary Variant (+, -) */}
            <div className="p-4 border rounded-lg space-y-3 text-center">
              <span className="text-xs text-gray-500 font-semibold block">
                variant="secondary" (Gray 600)
              </span>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <IconButton variant="secondary">
                    <PlusIcon className="w-8 h-8 text-white" />
                  </IconButton>
                  <span className="text-xs text-gray-500">Plus</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconButton variant="secondary">
                    <MinusIcon className="w-8 h-8 text-white" />
                  </IconButton>
                  <span className="text-xs text-gray-500">Minus</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconButton variant="secondary" disabled>
                    <PlusIcon className="w-8 h-8 text-white" />
                  </IconButton>
                  <span className="text-xs text-gray-500">Disabled</span>
                </div>
              </div>
            </div>

            {/* Outline Variant (Left Arrow / Back) */}
            <div className="p-4 border rounded-lg space-y-3 text-center">
              <span className="text-xs text-gray-500 font-semibold block">
                variant="outline" (Border Gray)
              </span>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <IconButton variant="outline">
                    <LeftArrowIcon className="w-8 h-8 text-gray-500" />
                  </IconButton>
                  <span className="text-xs text-gray-500">Enabled</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconButton variant="outline" disabled>
                    <LeftArrowIcon className="w-8 h-8 text-gray-500" />
                  </IconButton>
                  <span className="text-xs text-gray-500">Disabled</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Base Card & MissionCard & PersonnelCard (모든 상태) */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-8">
          <h2 className="text-heading-1-semibold text-gray-900 border-b border-gray-100 pb-2">
            4. Cards (Card, MissionCard, PersonnelCard의 모든 상태)
          </h2>

          {/* Base Card 상태별 */}
          <div className="space-y-4">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              Base Card 프레임 상태 (isSelected & isDisabled)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  미선택 (isSelected=false, 모서리 #737C72)
                </span>
                <Card isSelected={false}>
                  <p className="text-iphone-body-2-regular text-gray-700">
                    Base Card - Unselected State
                  </p>
                </Card>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  선택됨 (isSelected=true, 모서리 #4ca858)
                </span>
                <Card isSelected={true}>
                  <p className="text-iphone-body-2-regular text-gray-700">
                    Base Card - Selected State
                  </p>
                </Card>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  비활성화 (isDisabled=true, opacity-40)
                </span>
                <Card isDisabled={true}>
                  <p className="text-iphone-body-2-regular text-gray-700">
                    Base Card - Disabled State
                  </p>
                </Card>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  선택됨 + 비활성화 (isSelected=true, isDisabled=true)
                </span>
                <Card isSelected={true} isDisabled={true}>
                  <p className="text-iphone-body-2-regular text-gray-700">
                    Base Card - Selected & Disabled
                  </p>
                </Card>
              </div>
            </div>
          </div>

          {/* MissionCard 상태별 */}
          <div className="space-y-4">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              MissionCard 상태별 비교 (Unselected / Selected / Disabled / Toggle Demo)
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  1) 미선택 상태 (`isSelected={false}`)
                </span>
                <MissionCard
                  title="친해질 사이"
                  description="같은 포즈로 어색함을 풀어 보세요"
                  isSelected={false}
                />
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  2) 선택된 상태 (`isSelected={true}`)
                </span>
                <MissionCard
                  title="친해질 사이"
                  description="같은 포즈로 어색함을 풀어 보세요"
                  isSelected={true}
                />
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  3) 비활성화 상태 (`isDisabled={true}`)
                </span>
                <MissionCard
                  title="비활성화 미션"
                  description="현재 선택할 수 없는 미션입니다"
                  isDisabled={true}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    4) 대화형 토글 미션 카드 (클릭하여 선택 토글)
                  </span>
                  <span className="text-xs font-semibold text-green-500">
                    현재 상태: {isInteractiveMissionSelected ? "선택됨" : "미선택"}
                  </span>
                </div>
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setIsInteractiveMissionSelected(!isInteractiveMissionSelected)
                  }
                >
                  <MissionCard
                    title="마주보고 웃기"
                    description="서로 눈을 맞추고 3초간 미소를 지어보세요"
                    isSelected={isInteractiveMissionSelected}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PersonnelCard 수량별 & 대화형 테스트 */}
          <div className="space-y-4">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              PersonnelCard 수량 예시 및 대화형 연동 (모서리 색상 #737C72 고정)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">2인 예시</span>
                <PersonnelCard count={2} price={3000} />
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">4인 예시</span>
                <PersonnelCard count={4} price={6000} />
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">6인 예시</span>
                <PersonnelCard count={6} price={9000} />
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs text-gray-500 block mb-2">
                대화형 수량 변경 연동 (IconButton + PersonnelCard)
              </span>
              <div className="flex items-center gap-4">
                <IconButton
                  variant="secondary"
                  onClick={() =>
                    setPersonnelCount((prev) => Math.max(1, prev - 1))
                  }
                >
                  <MinusIcon className="w-8 h-8 text-white" />
                </IconButton>
                <PersonnelCard
                  count={personnelCount}
                  price={personnelCount * pricePerPerson}
                />
                <IconButton
                  variant="secondary"
                  onClick={() => setPersonnelCount((prev) => prev + 1)}
                >
                  <PlusIcon className="w-8 h-8 text-white" />
                </IconButton>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Modal & useModal 커스텀 훅 (다양한 형태 테스트) */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h2 className="text-heading-1-semibold text-gray-900 border-b border-gray-100 pb-2">
            5. Modal & useModal (다양한 모달 구성 상태)
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="inline" onClick={defaultModal.openModal}>
              1) 기본 확인/취소 모달 열기
            </Button>
            <Button variant="dark" size="inline" onClick={noticeModal.openModal}>
              2) 단일 버튼 안내 모달 열기
            </Button>
            <Button variant="darkGreen" size="inline" onClick={customBodyModal.openModal}>
              3) Custom Body 모달 열기
            </Button>
            <Button
              variant="gray"
              size="inline"
              onClick={() => setIsParentModalOpen(true)}
            >
              4) 중첩 모달 인라인 onClose 회귀 테스트
            </Button>
          </div>

          {/* 모달 1: 기본 Confirm / Cancel 모달 */}
          <Modal
            isOpen={defaultModal.isOpen}
            onClose={defaultModal.closeModal}
            title="미션을 시작할까요?"
            description={`선택 인원: ${personnelCount}명\n총 결제금액: ₩ ${(personnelCount * pricePerPerson).toLocaleString()}`}
            cancelText="취소"
            confirmText="시작하기"
            onConfirm={() => {
              alert("미션을 시작합니다!");
              defaultModal.closeModal();
            }}
          />

          {/* 모달 2: 단일 버튼 (안내 모달) */}
          <Modal
            isOpen={noticeModal.isOpen}
            onClose={noticeModal.closeModal}
            title="안내"
            description="인원 수 선택이 완료되었습니다."
            confirmText="확인"
            onConfirm={noticeModal.closeModal}
          />

          {/* 모달 3: Custom Children이 포함된 모달 */}
          <Modal
            isOpen={customBodyModal.isOpen}
            onClose={customBodyModal.closeModal}
            title="커스텀 내용 모달"
            icon={<ExclamationIcon className="w-6 h-6 text-white" />}
            cancelText="닫기"
            confirmText="완료"
            onConfirm={customBodyModal.closeModal}
          >
            <div className="bg-iphone-background p-4 rounded-lg text-center w-full text-iphone-body-2-regular text-gray-700">
              <p className="font-semibold text-gray-900">Custom Children Content</p>
              <p className="text-xs text-gray-600 mt-1">
                모달 내부에 자식 JSX 요소를 자유롭게 렌더링할 수 있습니다.
              </p>
            </div>
          </Modal>

          {/* 모달 4 & 5: 중첩 모달 인라인 onClose 재렌더링 회귀 테스트 */}
          <Modal
            isOpen={isParentModalOpen}
            onClose={() => setIsParentModalOpen(false)}
            title={`부모 모달 (재렌더링 횟수: ${parentRerenderCount})`}
            description="인라인 onClose 콜백을 가진 부모 모달입니다. 아래 버튼으로 자식 모달을 띄운 뒤 부모를 재렌더링해도 자식 모달의 최상단 스택 순서가 유지됩니다."
            cancelText="부모 닫기"
          >
            <div className="flex flex-col items-center gap-2 w-full pt-2">
              <Button
                variant="primary"
                size="block"
                onClick={() => setParentRerenderCount((prev) => prev + 1)}
              >
                부모 모달 강제 재렌더링 (+1)
              </Button>
              <Button
                variant="darkGreen"
                size="block"
                onClick={() => setIsChildModalOpen(true)}
              >
                자식 중첩 모달 열기
              </Button>
            </div>
          </Modal>

          <Modal
            isOpen={isChildModalOpen}
            onClose={() => setIsChildModalOpen(false)}
            title="자식 중첩 모달 (Topmost)"
            description="인라인 onClose 콜백을 가진 자식 모달입니다. 부모 모달이 재렌더링되어도 자식 모달이 최상위(Topmost) 상태를 유지하여 Escape 키 입력 시 자식 모달만 닫힙니다."
            confirmText="자식 닫기"
            onConfirm={() => setIsChildModalOpen(false)}
          />
        </section>

        {/* 6. PhotoFrame (모든 테마 & 다크/라이트 변형) */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
          <h2 className="text-heading-1-semibold text-gray-900 border-b border-gray-100 pb-2">
            6. PhotoFrame (사진 프레임 컴포넌트: 모든 테마 & 변형)
          </h2>

          {/* 피치못한 테마 */}
          <div className="space-y-3">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              1) 피치못한 테마 (`pichimothan` - Dark vs Light)
            </h3>
            <div className="flex flex-wrap items-center gap-6 bg-iphone-background p-6 rounded-xl justify-center sm:justify-start">
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="dark" theme="pichimothan" />
                <span className="text-xs text-gray-500 font-medium">Dark Variant</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="light" theme="pichimothan" />
                <span className="text-xs text-gray-500 font-medium">Light Variant</span>
              </div>
            </div>
          </div>

          {/* 마주하다 테마 */}
          <div className="space-y-3">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              2) 마주하다 테마 (`majuhada` - Dark vs Light)
            </h3>
            <div className="flex flex-wrap items-center gap-6 bg-iphone-background p-6 rounded-xl justify-center sm:justify-start">
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="dark" theme="majuhada" />
                <span className="text-xs text-gray-500 font-medium">Dark Variant</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="light" theme="majuhada" />
                <span className="text-xs text-gray-500 font-medium">Light Variant</span>
              </div>
            </div>
          </div>

          {/* 오버눅 테마 */}
          <div className="space-y-3">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              3) 오버눅 테마 (`overnook` - Dark vs Light)
            </h3>
            <div className="flex flex-wrap items-center gap-6 bg-iphone-background p-6 rounded-xl justify-center sm:justify-start">
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="dark" theme="overnook" />
                <span className="text-xs text-gray-500 font-medium">Dark Variant</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="light" theme="overnook" />
                <span className="text-xs text-gray-500 font-medium">Light Variant</span>
              </div>
            </div>
          </div>

          {/* 반짝 테마 */}
          <div className="space-y-3">
            <h3 className="text-iphone-heading-2-medium text-gray-700">
              4) 반짝 테마 (`banjjak` - Dark vs Light)
            </h3>
            <div className="flex flex-wrap items-center gap-6 bg-iphone-background p-6 rounded-xl justify-center sm:justify-start">
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="dark" theme="banjjak" />
                <span className="text-xs text-gray-500 font-medium">Dark Variant</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PhotoFrame variant="light" theme="banjjak" />
                <span className="text-xs text-gray-500 font-medium">Light Variant</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
