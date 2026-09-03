import { createFileRoute } from "@tanstack/react-router";
import { FrameDownloadPage } from "../features/frame-download/ui/FrameDownloadPage";

export const Route = createFileRoute("/intro/$sessionId/download")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId } = Route.useParams();
  return <FrameDownloadPage sessionId={sessionId} />;
}
