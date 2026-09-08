import { createFileRoute } from "@tanstack/react-router";
import { PartnerLocationPage } from "../features/partner-location/ui/PartnerLocationPage";

export const Route = createFileRoute("/intro/$galleryToken/location")({
  component: RouteComponent,
});

function RouteComponent() {
  const { galleryToken } = Route.useParams();
  return <PartnerLocationPage galleryToken={galleryToken} />;
}
