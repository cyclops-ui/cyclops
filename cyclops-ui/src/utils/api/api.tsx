import axios from "axios";

export async function getModule(moduleName: string): Promise<any> {
  const response = await axios.get(`/api/modules/${moduleName}`);
  return response.data;
}

export async function fetchModuleRawManifest(
  moduleName: string,
): Promise<string> {
  const resp = await axios.get(`/api/modules/${moduleName}/raw`);
  return resp.data;
}

export async function fetchModuleRenderedManifest(moduleName: string) {
  const resp = await axios.get(`/api/modules/${moduleName}/currentManifest`);
  return resp.data;
}

export async function reconcileModule(moduleName: string) {
  return await axios.post(`/api/modules/${moduleName}/reconcile`);
}

export async function deleteModule() {
  return Promise.resolve();
}

export async function fetchModuleResources(moduleName: string) {
  const resp = await axios.get(`/api/modules/${moduleName}/resources`);
  return resp.data;
}

export async function deleteResource(
  group: string,
  version: string,
  kind: string,
  name: string,
  namespace: string,
): Promise<boolean> {
  const resp = await axios.delete(`/api/resources`, {
    data: {
      group: group,
      version: version,
      kind: kind,
      name: name,
      namespace: namespace,
    },
  });
  return resp.data;
}

export function fetchResource(
  group: string,
  version: string,
  kind: string,
  name: string,
  namespace: string,
) {
  return async () => {
    const resp = await axios.get(`/api/resources`, {
      params: {
        group: group,
        version: version,
        kind: kind,
        name: name,
        namespace: namespace,
      },
    });
    return resp.data;
  };
}

export async function fetchResourceManifest(
  group: string,
  version: string,
  kind: string,
  namespace: string,
  name: string,
  includeManagedFields: boolean,
) {
  const resp = await axios.get(`/api/manifest`, {
    params: {
      group: group,
      version: version,
      kind: kind,
      name: name,
      namespace: namespace,
      includeManagedFields: includeManagedFields,
    },
  });
  return resp.data;
}

export async function restartResource(
  group: string,
  version: string,
  kind: string,
  name: string,
  namespace: string,
): Promise<any> {
  const resp = await axios.post(
    `/api/resources/restart?group=${group}&version=${version}&kind=${kind}&name=${name}&namespace=${namespace}`,
  );
  return resp.data;
}
