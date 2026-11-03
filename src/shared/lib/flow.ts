/** 결제 후 단계. 결제 복귀 후에는 URL의 `step`이 항상 이 중 하나다. */
export const POST_PAYMENT_STEPS = [
  "relation",
  "photo",
  "select-photo",
  "frame",
  "loading",
];

/** 사진과 진행 상태가 메모리에만 있어, 화면을 벗어나면 복구할 수 없는 구간인지 판단한다. */
export function isPostPaymentFlow(step: unknown): boolean {
  return typeof step === "string" && POST_PAYMENT_STEPS.includes(step);
}
