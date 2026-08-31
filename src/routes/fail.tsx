import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "../shared/ui/Button/Button";

export const Route = createFileRoute("/fail")({
  component: FailPage,
});

function FailPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  const handleRetry = () => {
    navigate({ to: "/snap", search: { step: "payment" } as any });
  };

  return (
    <div className="relative min-h-screen bg-ipad-background font-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-3xl font-bold">
          ✕
        </div>
        <h2 className="text-2xl font-bold text-black">결제에 실패하였습니다</h2>

        <div className="w-full bg-gray-50 rounded-xl p-4 flex flex-col gap-3 text-left text-sm">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-500">에러코드</span>
            <span className="font-semibold text-red-600 font-mono">
              {code || "UNKNOWN_ERROR"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500">실패 사유</span>
            <span className="font-medium text-gray-800">
              {message || "결제 과정 중 오류가 발생했습니다."}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleRetry}
          className="w-full py-3.5 rounded-xl font-bold text-base mt-2"
        >
          결제 다시 시도하기
        </Button>
      </div>
    </div>
  );
}
