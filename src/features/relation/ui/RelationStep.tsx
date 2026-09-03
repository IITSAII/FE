import { useRef, useState } from "react";
import { MissionCard } from "../../../shared/ui/Card/MissionCard";
import { IconButton } from "../../../shared/ui/IconButton/IconButton";
import { useCountdown } from "../../../shared/hooks/useCountdown";
import { useStepExpiry } from "../../../shared/hooks/useStepExpiry";
import { submitRelationship, type RelationshipType } from "../api/relationApi";
import RightArrowIcon from "../../../shared/assets/icons/RightArrowIcon.svg?react";
import LeftArrowIcon from "../../../shared/assets/icons/LeftArrowIcon.svg?react";

export interface RelationOption {
  id: string;
  title: string;
  description: string;
  relationshipType: RelationshipType;
}

export interface RelationStepData {
  selectedRelationId: string | null;
  selectedRelationTitle: string | null;
}

export interface RelationStepProps {
  sessionId: string;
  onNext?: (data: RelationStepData) => void;
  onBack?: () => void;
}

const RELATION_OPTIONS: RelationOption[] = [
  {
    id: "close",
    title: "친해질 사이",
    description: "같은 포즈로 어색함을 풀어 보세요",
    relationshipType: "GETTING_CLOSE",
  },
  {
    id: "friend",
    title: "친구 사이",
    description: "장난스러운 케미를 남겨 보세요",
    relationshipType: "FRIEND",
  },
  {
    id: "some",
    title: "썸 타는 사이",
    description: "설레는 순간을 남겨 보세요",
    relationshipType: "CRUSH",
  },
  {
    id: "lover",
    title: "연인 사이",
    description: "가까이 기대어 다정한 순간을 남겨 보세요",
    relationshipType: "COUPLE",
  },
];

/**
 * 관계 선택 플로우 단계 컴포넌트 (RelationStep)
 * - MissionCard 컴포넌트를 합성하여 어떤 사이인지 관계 옵션을 선택하고 다음 플로우 단계로 전환합니다.
 */
export function RelationStep({ sessionId, onNext, onBack }: RelationStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasSubmittedRef = useRef(false);

  const { status } = useStepExpiry(sessionId);

  const handleSelectRelation = (id: string) => {
    setSelectedId(id);
  };

  const handleSkipRelation = () => {
    setSelectedId("none");
  };

  const proceed = async (idToSubmit: string | null) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    const resolvedId = idToSubmit ?? "none";
    const selectedOption = RELATION_OPTIONS.find(
      (opt) => opt.id === resolvedId,
    );

    try {
      await submitRelationship(
        sessionId,
        selectedOption?.relationshipType ?? null,
      );
    } catch (err) {
      console.error("관계 선택 제출 실패:", err);
    }

    onNext?.({
      selectedRelationId: resolvedId,
      selectedRelationTitle:
        resolvedId === "none" ? "관계 설정 안 함" : (selectedOption?.title ?? null),
    });
  };

  const handleNextStep = () => {
    proceed(selectedId);
  };

  const handleExpire = () => {
    // 만료 시 가장 최근에 선택한 관계를 자동으로 선택하고, 선택한 적이 없으면 "관계 설정 안 하기"로 처리한다.
    proceed(selectedId ?? "none");
  };

  const { secondsLeft } = useCountdown({
    expiresAt: status?.stepExpiresAt,
    enabled: status?.stepExpiresAt != null && !isSubmitting,
    onExpire: handleExpire,
  });

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center">
      {/* 메인 프레임 영역 (최대 너비 834px 대응) */}
      <main className="w-full max-w-[834px] px-6 pt-18 pb-[53.5px] flex-1 flex flex-col justify-between">
        {/* 서브 타이머 */}
        <div className="w-full flex justify-end">
          <span className="text-ipad-heading-1-medium text-gray-600">
            {secondsLeft}
          </span>
        </div>

        {/* 타이틀 영역 */}
        <div className="w-full pt-15 flex flex-col items-center gap-2">
          <h2 className="text-ipad-heading-2-medium text-black">
            오늘의 관계를 선택해주세요 !
          </h2>
          <p className="text-ipad-body-1-light text-gray-600">
            선택한 사이에 맞춰 포즈 미션이 달라져요.
          </p>
        </div>

        {/* 관계 선택 MissionCard 리스트 및 관계 설정 안 하기 옵션 */}
        <div className="w-full flex flex-col items-center gap-11 my-auto px-12.75">
          <div className="w-full flex flex-col items-center gap-8">
            {RELATION_OPTIONS.map((option) => (
              <MissionCard
                key={option.id}
                title={option.title}
                description={option.description}
                isSelected={selectedId === option.id}
                isDisabled={selectedId !== null && selectedId !== option.id}
                onClick={() => handleSelectRelation(option.id)}
                className="cursor-pointer"
              />
            ))}
          </div>

          {/* 관계 설정 안 하기 하단 옵션 */}
          <button
            type="button"
            onClick={handleSkipRelation}
            className={`text-ipad-heading-3-medium cursor-pointer text-gray-500 ${
              selectedId === "none" ? "text-green-500" : ""
            }`}
          >
            관계 설정 안 하기
          </button>
        </div>

        {/* 하단 네비게이션 버튼 (뒤로가기 & 다음 버튼) */}
        <div className="w-full flex items-center justify-between pt-20">
          <IconButton
            variant="outline"
            onClick={onBack}
            aria-label="이전 단계로 이동"
          >
            <LeftArrowIcon className="w-8 h-8 text-gray-500" />
          </IconButton>

          <IconButton
            variant="primary"
            onClick={handleNextStep}
            disabled={!selectedId || isSubmitting}
            aria-label="다음 단계로 이동"
          >
            <RightArrowIcon className="w-8 h-8 text-green-200" />
          </IconButton>
        </div>
      </main>
    </div>
  );
}
