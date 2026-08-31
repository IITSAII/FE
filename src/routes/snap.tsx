import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  QuantityStep,
  type QuantityStepData,
} from "../features/quantity/ui/QuantityStep";
import { PaymentStep } from "../features/payment/ui/PaymentStep";
import {
  RelationStep,
  type RelationStepData,
} from "../features/relation/ui/RelationStep";
import {
  PhotoStep,
  type PhotoStepData,
} from "../features/photo/ui/PhotoStep";
import {
  PhotoSelectionStep,
  type PhotoSelectionStepData,
} from "../features/photo-selection/ui/PhotoSelectionStep";
import { FrameStep } from "../features/frame/ui/FrameStep";
import { LoadingStep } from "../features/loading/ui/LoadingStep";

export type FlowStep =
  | "quantity"
  | "payment"
  | "relation"
  | "photo"
  | "select-photo"
  | "frame"
  | "loading";

export const Route = createFileRoute("/snap")({
  component: SnapFlowPage,
});

function SnapFlowPage() {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const initialStep = (searchParams?.get("step") as FlowStep) || "quantity";

  const [currentStep, setCurrentStep] = useState<FlowStep>(initialStep);
  const [quantityData, setQuantityData] = useState<QuantityStepData | null>(
    null,
  );
  const [relationData, setRelationData] = useState<RelationStepData | null>(
    null,
  );
  const [photoData, setPhotoData] = useState<PhotoStepData | null>(null);
  const [selectedPhotoData, setSelectedPhotoData] =
    useState<PhotoSelectionStepData | null>(null);

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

  const handleFrameNext = () => {
    setCurrentStep("loading");
  };

  const handleResetFlow = () => {
    setQuantityData(null);
    setRelationData(null);
    setPhotoData(null);
    setSelectedPhotoData(null);
    setCurrentStep("quantity");
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
      {currentStep === "quantity" && (
        <QuantityStep onNext={handleQuantityNext} />
      )}
      {currentStep === "payment" && (
        <PaymentStep
          totalPrice={quantityData?.totalPrice}
          personnelCount={quantityData?.personnelCount}
          onNext={handlePaymentNext}
          onBack={handleBackToQuantity}
        />
      )}
      {currentStep === "relation" && (
        <RelationStep
          onNext={handleRelationNext}
          onBack={handleBackToPayment}
        />
      )}
      {currentStep === "photo" && (
        <PhotoStep
          selectedRelationTitle={relationData?.selectedRelationTitle}
          onNext={handlePhotoNext}
          onBack={handleBackToRelation}
        />
      )}
      {currentStep === "select-photo" && (
        <PhotoSelectionStep
          capturedPhotos={photoData?.photos}
          onNext={handleSelectionNext}
          onBack={handleBackToPhoto}
        />
      )}
      {currentStep === "frame" && (
        <FrameStep
          selectedPhotos={selectedPhotoData?.selectedPhotos}
          relationshipTitle={relationData?.selectedRelationTitle}
          onNext={handleFrameNext}
          onBack={handleBackToSelection}
        />
      )}
      {currentStep === "loading" && (
        <LoadingStep onComplete={handleResetFlow} />
      )}
    </div>
  );
}
