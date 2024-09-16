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
