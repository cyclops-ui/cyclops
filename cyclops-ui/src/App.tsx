import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes";
import Page404 from "./components/pages/Page404";
import AppLayout from "./components/layouts/AppLayout";
import { ThemeProvider } from "./components/theme/ThemeContext";

export default function App() {
  const router = createBrowserRouter([
    {
      element: (
        <ThemeProvider>
          <AppLayout />
        </ThemeProvider>
      ),
      errorElement: <Page404 />,
      children: routes,
    },
  ]);

  return <RouterProvider router={router} />;
}
