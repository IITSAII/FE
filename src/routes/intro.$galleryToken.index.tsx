import { createFileRoute } from "@tanstack/react-router";
import { IntroGalleryPage } from "../features/intro-gallery/ui/IntroGalleryPage";

export const Route = createFileRoute("/intro/$galleryToken/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { galleryToken } = Route.useParams();
  return <IntroGalleryPage galleryToken={galleryToken} />;
}
