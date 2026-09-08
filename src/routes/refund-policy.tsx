import { createFileRoute } from "@tanstack/react-router";
import { RefundPolicyPage } from "../features/refund-policy/ui/RefundPolicyPage";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
});
