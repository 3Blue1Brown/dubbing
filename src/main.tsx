import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { FallbackProps } from "react-error-boundary";
import { ErrorBoundary } from "react-error-boundary";
import {
  createBrowserRouter,
  Outlet,
  redirect,
  RouterProvider,
} from "react-router";
import Home from "@/pages/Home.tsx";
import Lesson from "@/pages/lesson/Lesson.tsx";
import "@/util/tooltips";
import "./main.css";

/** route layout */
const Layout = () => {
  return (
    <main>
      <ErrorBoundary fallbackRender={HandlerError}>
        <Outlet />
      </ErrorBoundary>
    </main>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          const path = window.sessionStorage.redirectPath || "";
          if (path) {
            console.debug("Redirecting to:", path);
            window.sessionStorage.removeItem("redirectPath");
            return redirect(path);
          } else return null;
        },
      },
      {
        path: "/:year/:title/:language",
        element: <Lesson />,
      },
    ],
  },
]);

const HandlerError = ({ error, resetErrorBoundary }: FallbackProps) => (
  <>
    <h2>Application Error</h2>
    {error instanceof Error ? (
      <>
        {error.message}
        <br />
        <br />
        {error.stack}
      </>
    ) : (
      String(error)
    )}
    <button onClick={resetErrorBoundary}>Reset</button>
  </>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
