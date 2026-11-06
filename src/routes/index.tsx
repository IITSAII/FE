import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { IntroStep } from "../features/intro/ui/IntroStep";
import {
  QuantityStep,
  type QuantityStepData,
} from "../features/quantity/ui/QuantityStep";
import {
  ALLOWED_PERSONNEL_COUNTS,
  PRICE_PER_PERSON,
} from "../features/quantity/lib/pricing";
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
import { Button } from "../shared/ui/Button/Button";
import { getSessionStatus } from "../features/payment/api/paymentApi";
import { isApiError } from "../shared/lib/apiError";
import { formatFrameDate } from "../shared/lib/date";
import { isPostPaymentFlow } from "../shared/lib/flow";

export type FlowStep =
  | "intro"
  | "quantity"
  | "payment"
  | "relation"
  | "photo"
  | "select-photo"
  | "frame"
  | "loading";

const FLOW_STEPS: FlowStep[] = [
  "intro",
  "quantity",
  "payment",
  "relation",
  "photo",
  "select-photo",
  "frame",
  "loading",
];

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
    const personnelCount = parsed?.personnelCount;
    // 허용된 인원 수만 복원하고, 금액은 저장값 대신 인원 수로 다시 계산해 둘이 어긋나지 않게 한다.
    if (
      typeof personnelCount === "number" &&
      ALLOWED_PERSONNEL_COUNTS.includes(personnelCount)
    ) {
      return {
        personnelCount,
        totalPrice: personnelCount * PRICE_PER_PERSON,
      };
    }
  } catch {
    // 손상된 값은 무시하고 수량 선택부터 다시 진행한다.
  }
  return null;
}

function SnapFlowPage() {
  const navigate = useNavigate();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const stepParam = searchParams?.get("step");
  // 목록에 없는 step 값이면 어떤 단계도 렌더링되지 않아 빈 화면이 되므로 인트로로 보낸다.
  const requestedStep: FlowStep = FLOW_STEPS.includes(stepParam as FlowStep)
    ? (stepParam as FlowStep)
    : "intro";

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

  const isPostPaymentStep = isPostPaymentFlow(requestedStep);
  // 수량 정보 없이 결제 단계로 진입하면 임의 기본값으로 결제하지 않도록 수량 선택부터 다시 진행한다.
  const isPaymentStepWithoutQuantity =
    requestedStep === "payment" && quantityData == null;
  // 결제 후 단계는 수량 값이 있어도 결제가 확인된 세션만 진입할 수 있다.
  const initialStep: FlowStep =
    (isPostPaymentStep && !hasValidatedPaymentSession) ||
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
  // 사진과 단계 데이터는 메모리에만 있다. 새로고침 등으로 다시 마운트되면 서버 단계를 먼저 확인한다.
  const [flowRecovery, setFlowRecovery] = useState<
    "checking" | "unrecoverable" | null
  >(initialStep !== "quantity" && isPostPaymentStep ? "checking" : null);

  const handleIntroNext = () => {
    setCurrentStep("quantity");
  };

  const handleQuantityNext = (data: QuantityStepData) => {
    // 실패 복귀는 수량 선택을 거치지 않으므로, 여기까지 남은 실패 플래그는 이번 결제와 무관하다.
    sessionStorage.removeItem("payment_failed");
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
    // 이전 사용자의 ?step= 값이 남아 있으면 다음 사용자가 새로고침할 때 그 단계로 진입한다.
    navigate({ to: "/", replace: true });
  };

  useEffect(() => {
    if (flowRecovery !== "checking" || !sessionId) return;

    const controller = new AbortController();

    getSessionStatus(sessionId, controller.signal)
      .then(({ currentStep: serverStep }) => {
        if (serverStep === "RELATIONSHIP") {
          setCurrentStep("relation");
          setFlowRecovery(null);
        } else if (
          serverStep === "CAPTURE" ||
          serverStep === "SELECT" ||
          serverStep === "FRAME"
        ) {
          setFlowRecovery("unrecoverable");
        } else {
          // PRINT/DONE은 이미 인쇄로 넘어간 세션이고, 그 전 단계는 결제가 확인되지 않은 세션이다.
          // 어느 쪽이든 이어갈 촬영이 없으므로 처음으로 돌아간다.
          setFlowRecovery(null);
          handleResetFlow();
        }
      })
      .catch((err) => {
        if (isApiError(err) && err.code === "CANCELED") return;
        // 확인 자체가 실패하면 막지 않는다. 다음 요청이 실패하면 각 단계에서 안내한다.
        console.error("세션 단계 확인 실패:", err);
        setCurrentStep("relation");
        setFlowRecovery(null);
      });

    return () => controller.abort();
  }, []);

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

  if (flowRecovery === "checking") {
    return <div className="w-full min-h-screen bg-ipad-background" />;
  }

  if (flowRecovery === "unrecoverable") {
    return (
      <div className="w-full min-h-screen bg-ipad-background font-primary flex flex-col items-center justify-center gap-2 px-6 text-center">
        <h2 className="text-ipad-heading-2-medium text-black">
          촬영을 이어갈 수 없어요
        </h2>
        <p className="text-ipad-body-1-light text-gray-600">
          결제는 완료되어 있으니 직원을 불러주세요.
        </p>
        <p className="text-ipad-body-1-light text-gray-600">
          주문번호 {sessionId}
        </p>
        <div className="pt-2">
          <Button
            variant="gray"
            size="inline"
            onClick={() => {
              setFlowRecovery(null);
              handleResetFlow();
            }}
          >
            처음으로
          </Button>
        </div>
      </div>
    );
  }

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
          photos={frameData?.photoUrls}
          relationshipTitle={relationData?.selectedRelationTitle}
          frameId={frameData?.frameId}
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
