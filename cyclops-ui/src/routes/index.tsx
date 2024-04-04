import React from "react";
import PathConstants from "./PathConstants";

const Home = React.lazy(() => import("../components/pages/Modules/Modules"));
const Modules = React.lazy(() => import("../components/pages/Modules/Modules"));
const NewModule = React.lazy(() => import("../components/pages/NewModule"));
const ModuleDetails = React.lazy(
  () => import("../components/pages/ModuleDetails")
);
const EditModule = React.lazy(() => import("../components/pages/EditModule"));
const ModuleHistory = React.lazy(() => import("../components/pages/History"));
const Nodes = React.lazy(() => import("../components/pages/Nodes"));
const NodeDetails = React.lazy(() => import("../components/pages/NodeDetails"));

const routes = [
  { path: PathConstants.HOME, element: <Home /> },
  { path: PathConstants.MODULES, element: <Modules /> },
  { path: PathConstants.MODULE_NEW, element: <NewModule /> },
  { path: PathConstants.MODULE_GET, element: <ModuleDetails /> },
  { path: PathConstants.MODULE_EDIT, element: <EditModule /> },
  { path: PathConstants.MODULE_ROLLBACK, element: <ModuleHistory /> },
  { path: PathConstants.NODES, element: <Nodes /> },
  { path: PathConstants.NODE_GET, element: <NodeDetails /> },
];

export default routes;
