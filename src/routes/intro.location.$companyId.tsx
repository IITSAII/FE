import { createFileRoute } from "@tanstack/react-router";
import { CompanyLocationPage } from "../features/intro-gallery/ui/CompanyLocationPage";

export const Route = createFileRoute("/intro/location/$companyId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { companyId } = Route.useParams();
  return <CompanyLocationPage companyId={companyId} />;
}
