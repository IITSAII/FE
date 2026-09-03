import { createFileRoute } from "@tanstack/react-router";
import { IntroGalleryPage } from "../features/intro-gallery/ui/IntroGalleryPage";

export const Route = createFileRoute("/intro/$sessionId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId } = Route.useParams();
  return <IntroGalleryPage sessionId={sessionId} />;
}
