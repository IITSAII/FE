import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/fail")({
  component: FailPage,
});

/** 결제 실패 후 재진입 시 결제 화면에서 실패 모달을 띄우기 위한 세션 플래그. */
const PAYMENT_FAILED_FLAG_KEY = "payment_failed";

/**
 * 토스페이먼츠가 결제 실패 시 리다이렉트하는 페이지.
 * 별도의 실패 화면을 보여주지 않고, 결제 화면으로 돌아가 실패 모달을 띄운다.
 */
function FailPage() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem(PAYMENT_FAILED_FLAG_KEY, "1");
    navigate({ to: "/", search: { step: "payment" } });
  }, [navigate]);

  return <div className="min-h-screen bg-ipad-background" />;
}
