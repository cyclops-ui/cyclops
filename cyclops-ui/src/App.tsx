import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"
import routes from "./routes"
import Page404 from "./components/pages/Page404"
import AppLayout from "./AppLayout";

export default function App() {
  const router = createBrowserRouter([
    {
      element: <AppLayout />,
      errorElement: <Page404 />,
      children: routes
    },
  ])

  return (
      <RouterProvider router={router} />
  )
}