export interface ResourceRef {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
}

export function resourceRefKey(r: ResourceRef): string {
  return `${r.group}/${r.version}/${r.kind}/${r.namespace}/${r.name}`;
}

export function isWorkload(r: ResourceRef): boolean {
  return isDeployment(r) || isStatefulSet(r) || isDaemonSet(r);
}

export function isDeployment(r: ResourceRef): boolean {
  return r.group === "apps" && r.version === "v1" && r.kind === "Deployment";
}

export function isStatefulSet(r: ResourceRef): boolean {
  return r.group === "apps" && r.version === "v1" && r.kind === "StatefulSet";
}

export function isDaemonSet(r: ResourceRef): boolean {
  return r.group === "apps" && r.version === "v1" && r.kind === "DaemonSet";
}
