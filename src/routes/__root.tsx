import { createRootRoute, Outlet } from "@tanstack/react-router";
import Header from "../shared/ui/Header/Header";
import Footer from "../shared/ui/Footer/Footer";

export const Route = createRootRoute({
  component: () => (
    <div className="h-full min-h-screen max-w-full min-w-fit flex flex-col">
      <Header />
      <Outlet />
      <Footer />
    </div>
  ),
});
