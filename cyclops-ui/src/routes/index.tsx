import React from "react";
import PathConstants from "./PathConstants";

const Home = React.lazy(() => import("../components/pages/modules"));
const Modules = React.lazy(() => import("../components/pages/modules"));
const NewModule = React.lazy(() => import("../components/pages/new_module"));
const ModuleDetails = React.lazy(
  () => import("../components/pages/ModuleDetails")
);
const EditModule = React.lazy(() => import("../components/pages/edit_module"));
const ModuleHistory = React.lazy(() => import("../components/pages/history"));
const Nodes = React.lazy(() => import("../components/pages/nodes"));
const NodeDetails = React.lazy(
  () => import("../components/pages/node_details")
);
const Templates = React.lazy(() => import("../components/pages/TemplateStore"));

const routes = [
  { path: PathConstants.HOME, element: <Home /> },
  { path: PathConstants.MODULES, element: <Modules /> },
  { path: PathConstants.MODULE_NEW, element: <NewModule /> },
  { path: PathConstants.MODULE_GET, element: <ModuleDetails /> },
  { path: PathConstants.MODULE_EDIT, element: <EditModule /> },
  { path: PathConstants.MODULE_ROLLBACK, element: <ModuleHistory /> },
  { path: PathConstants.NODES, element: <Nodes /> },
  { path: PathConstants.NODE_GET, element: <NodeDetails /> },
  { path: PathConstants.TEMPLATES, element: <Templates /> },
];

export default routes;
