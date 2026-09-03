import { createFileRoute } from "@tanstack/react-router";
import { PartnerLocationPage } from "../features/partner-location/ui/PartnerLocationPage";

export const Route = createFileRoute("/intro/$sessionId/location")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId } = Route.useParams();
  return <PartnerLocationPage sessionId={sessionId} />;
}
