import { createFileRoute } from "@tanstack/react-router";
import { IntroGalleryPage } from "../features/intro-gallery/ui/IntroGalleryPage";

export const Route = createFileRoute("/intro/")({
  component: IntroGalleryPage,
});
