import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/intro/$sessionId")({
  component: Outlet,
});
