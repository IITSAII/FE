import { createFileRoute } from "@tanstack/react-router";
import { FrameDownloadPage } from "../features/frame-download/ui/FrameDownloadPage";

export const Route = createFileRoute("/intro/$galleryToken/download")({
  component: RouteComponent,
});

function RouteComponent() {
  const { galleryToken } = Route.useParams();
  return <FrameDownloadPage galleryToken={galleryToken} />;
}
