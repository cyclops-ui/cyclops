const PathConstants = {
  HOME: "/",
  MODULES: "/modules",
  MODULE_NEW: "/modules/new",
  MODULE_GET: "/modules/:moduleName",
  MODULE_EDIT: "/modules/:moduleName/edit",
  MODULE_ROLLBACK: "/modules/:moduleName/rollback",
  NODES: "/nodes",
  NODE_GET: "/nodes/:nodeName",
  TEMPLATES: "/templates",
  HELM_RELEASES: "/helm/releases",
  HELM_RELEASE: "/helm/releases/:releaseNamespace/:releaseName",
  HELM_RELEASE_EDIT: "/helm/releases/:releaseNamespace/:releaseName/edit",
};

export default PathConstants;
