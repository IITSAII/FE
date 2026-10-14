import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { IntroStep } from "../features/intro/ui/IntroStep";
import {
  QuantityStep,
  type QuantityStepData,
} from "../features/quantity/ui/QuantityStep";
import { PaymentStep } from "../features/payment/ui/PaymentStep";
import {
  RelationStep,
  type RelationStepData,
} from "../features/relation/ui/RelationStep";
import { PhotoStep, type PhotoStepData } from "../features/photo/ui/PhotoStep";
import {
  PhotoSelectionStep,
  type PhotoSelectionStepData,
} from "../features/photo-selection/ui/PhotoSelectionStep";
import { FrameStep, type FrameStepData } from "../features/frame/ui/FrameStep";
import { LoadingStep } from "../features/loading/ui/LoadingStep";
import { formatFrameDate } from "../shared/lib/date";

export type FlowStep =
  | "intro"
  | "quantity"
  | "payment"
  | "relation"
  | "photo"
  | "select-photo"
  | "frame"
  | "loading";

export const Route = createFileRoute("/")({
  component: SnapFlowPage,
});

/** 수량 선택 결과(인원 수/금액)를 플로우 재마운트 후에도 유지하기 위한 세션 키. */
const QUANTITY_STORAGE_KEY = "payment_quantity";

function readStoredQuantity(): QuantityStepData | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      sessionStorage.getItem(QUANTITY_STORAGE_KEY) ?? "null",
    ) as Partial<QuantityStepData> | null;
    if (
      typeof parsed?.personnelCount === "number" &&
      typeof parsed.totalPrice === "number"
    ) {
      return {
        personnelCount: parsed.personnelCount,
        totalPrice: parsed.totalPrice,
      };
    }
  } catch {
    // 손상된 값은 무시하고 수량 선택부터 다시 진행한다.
  }
  return null;
}

function SnapFlowPage() {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const requestedStep = (searchParams?.get("step") as FlowStep) || "intro";

  const hasValidatedPaymentSession =
    typeof window !== "undefined" &&
    (() => {
      const confirmedSessionId = sessionStorage.getItem(
        "payment_confirmed_session_id",
      );
      const activeSessionId = sessionStorage.getItem("payment_session_id");
      return (
        Boolean(confirmedSessionId) && confirmedSessionId === activeSessionId
      );
    })();

  // 결제 실패/취소로 /fail → / 리다이렉트되면 이 컴포넌트가 새로 마운트되므로,
  // 수량 선택 결과를 sessionStorage에서 복원한다(없으면 결제 단계가 기본값 2인으로 세션을 만든다).
  const [quantityData, setQuantityData] = useState<QuantityStepData | null>(
    readStoredQuantity,
  );

  const postPaymentSteps: FlowStep[] = [
    "relation",
    "photo",
    "select-photo",
    "frame",
    "loading",
  ];
  const isPostPaymentStep = postPaymentSteps.includes(requestedStep);
  // 수량 정보 없이 결제 단계로 진입하면 임의 기본값으로 결제하지 않도록 수량 선택부터 다시 진행한다.
  const isPaymentStepWithoutQuantity =
    requestedStep === "payment" && quantityData == null;
  const initialStep: FlowStep =
    (isPostPaymentStep && quantityData == null && !hasValidatedPaymentSession) ||
    isPaymentStepWithoutQuantity
      ? "quantity"
      : requestedStep;

  const [currentStep, setCurrentStep] = useState<FlowStep>(initialStep);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("payment_session_id")
      : null,
  );
  const [relationData, setRelationData] = useState<RelationStepData | null>(
    null,
  );
  const [photoData, setPhotoData] = useState<PhotoStepData | null>(null);
  const [selectedPhotoData, setSelectedPhotoData] =
    useState<PhotoSelectionStepData | null>(null);
  const [frameData, setFrameData] = useState<FrameStepData | null>(null);

  const handleIntroNext = () => {
    setCurrentStep("quantity");
  };

  const handleQuantityNext = (data: QuantityStepData) => {
    sessionStorage.setItem(QUANTITY_STORAGE_KEY, JSON.stringify(data));
    setQuantityData(data);
    setCurrentStep("payment");
  };

  const handlePaymentNext = () => {
    setCurrentStep("relation");
  };

  const handleRelationNext = (data: RelationStepData) => {
    setRelationData(data);
    setCurrentStep("photo");
  };

  const handlePhotoNext = (data: PhotoStepData) => {
    setPhotoData(data);
    setCurrentStep("select-photo");
  };

  const handleSelectionNext = (data: PhotoSelectionStepData) => {
    setSelectedPhotoData(data);
    setCurrentStep("frame");
  };

  const handleFrameNext = (data: FrameStepData) => {
    setFrameData(data);
    setCurrentStep("loading");
  };

  const handleResetFlow = () => {
    sessionStorage.removeItem("payment_session_id");
    sessionStorage.removeItem("payment_confirmed_session_id");
    sessionStorage.removeItem(QUANTITY_STORAGE_KEY);
    // 결제 화면에 도달하지 못해 소비되지 않은 실패 플래그가 다음 사용자에게 실패 모달로 뜨지 않도록 지운다.
    sessionStorage.removeItem("payment_failed");
    setSessionId(null);
    setQuantityData(null);
    setRelationData(null);
    setPhotoData(null);
    setSelectedPhotoData(null);
    setFrameData(null);
    setCurrentStep("intro");
  };

  const handleBackToQuantity = () => {
    setCurrentStep("quantity");
  };

  const handleBackToPayment = () => {
    setCurrentStep("payment");
  };

  const handleBackToRelation = () => {
    setCurrentStep("relation");
  };

  const handleBackToPhoto = () => {
    setCurrentStep("photo");
  };

  const handleBackToSelection = () => {
    setCurrentStep("select-photo");
  };

  return (
    <div className="w-full min-h-screen">
      {currentStep === "intro" && <IntroStep onNext={handleIntroNext} />}
      {currentStep === "quantity" && (
        <QuantityStep onNext={handleQuantityNext} onExpire={handleResetFlow} />
      )}
      {currentStep === "payment" && (
        <PaymentStep
          totalPrice={quantityData?.totalPrice}
          personnelCount={quantityData?.personnelCount}
          onNext={handlePaymentNext}
          onBack={handleBackToQuantity}
          onExpire={handleResetFlow}
          onSessionCreated={setSessionId}
        />
      )}
      {currentStep === "relation" && sessionId && (
        <RelationStep
          sessionId={sessionId}
          onNext={handleRelationNext}
          onBack={handleBackToPayment}
        />
      )}
      {currentStep === "photo" && sessionId && (
        <PhotoStep
          sessionId={sessionId}
          selectedRelationId={relationData?.selectedRelationId}
          selectedRelationTitle={relationData?.selectedRelationTitle}
          onNext={handlePhotoNext}
          onBack={handleBackToRelation}
        />
      )}
      {currentStep === "select-photo" && sessionId && (
        <PhotoSelectionStep
          sessionId={sessionId}
          capturedPhotos={photoData?.photos}
          onNext={handleSelectionNext}
          onBack={handleBackToPhoto}
        />
      )}
      {currentStep === "frame" && sessionId && (
        <FrameStep
          sessionId={sessionId}
          selectedPhotos={selectedPhotoData?.selectedPhotos}
          relationshipTitle={relationData?.selectedRelationTitle}
          onNext={handleFrameNext}
          onBack={handleBackToSelection}
        />
      )}
      {currentStep === "loading" && sessionId && (
        <LoadingStep
          sessionId={sessionId}
          photos={selectedPhotoData?.selectedPhotos.map(
            (photo) => photo.dataUrl,
          )}
          relationshipTitle={relationData?.selectedRelationTitle}
          design={frameData?.design}
          variant={frameData?.variant}
          theme={frameData?.theme}
          filter={frameData?.filter}
          date={frameData?.date ?? formatFrameDate()}
          onComplete={handleResetFlow}
          onBack={handleResetFlow}
        />
      )}
    </div>
  );
}
