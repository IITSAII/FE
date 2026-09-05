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

  const [quantityData, setQuantityData] = useState<QuantityStepData | null>(
    null,
  );

  const postPaymentSteps: FlowStep[] = [
    "relation",
    "photo",
    "select-photo",
    "frame",
    "loading",
  ];
  const isPostPaymentStep = postPaymentSteps.includes(requestedStep);
  const initialStep: FlowStep =
    isPostPaymentStep && quantityData == null && !hasValidatedPaymentSession
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
