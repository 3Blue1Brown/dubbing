import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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
      <Outlet />
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
