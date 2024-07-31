import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes";
import Page404 from "./components/pages/Page404";
import AppLayout from "./components/layouts/AppLayout";
import { useAuth } from "./context/AuthContext";
import Login from "./components/pages/Login/Login";

export default function App() {
  const { isAuthenticated } = useAuth();

  const router = createBrowserRouter([
    {
      element: isAuthenticated ? <AppLayout /> : <Login />,
      errorElement: <Page404 />,
      children: routes,
    },
  ]);

  return <RouterProvider router={router} />;
}
