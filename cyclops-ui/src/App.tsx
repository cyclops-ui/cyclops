import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes";
import Page404 from "./components/pages/Page404";
import AppLayout from "./components/layouts/AppLayout";
import { useAuth } from "./context/AuthContext";
import Login from "./components/pages/Login/Login";
import { useEffect, useState } from "react";

export default function App() {
  const { isAuthenticated, checkAuthentication } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuthentication();
      setIsLoading(false);
    };
    initAuth();
  }, [checkAuthentication]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated loading component
  }

  const router = createBrowserRouter([
    {
      element: isAuthenticated ? <AppLayout /> : <Login />,
      errorElement: <Page404 />,
      children: routes,
    },
  ]);

  return <RouterProvider router={router} />;
}
