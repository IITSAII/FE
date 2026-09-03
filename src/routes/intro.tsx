import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/intro")({
  component: Outlet,
});
