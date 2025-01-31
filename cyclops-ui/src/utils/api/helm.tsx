import axios from "axios";

export async function getHelmRelease(
  releaseNamespace: string,
  releaseName: string,
): Promise<any> {
  const resp = await axios.get(
    `/api/helm/releases/${releaseNamespace}/${releaseName}`,
  );
  return resp.data;
}

export async function getHelmReleaseValues(
  releaseNamespace: string,
  releaseName: string,
): Promise<any> {
  const resp = await axios.get(
    `/api/helm/releases/${releaseNamespace}/${releaseName}/values`,
  );
  return resp.data;
}

export async function getHelmReleaseFields(
  releaseNamespace: string,
  releaseName: string,
): Promise<any> {
  const resp = await axios.get(
    `/api/helm/releases/${releaseNamespace}/${releaseName}/fields`,
  );
  return resp.data;
}

export async function migrateHelmRelease(
  releaseNamespace: string,
  releaseName: string,
  values: any,
  templateRef: any,
) {
  return await axios.post(
    `/api/helm/releases/${releaseNamespace}/${releaseName}/migrate`,
    {
      name: releaseName,
      namespace: releaseNamespace,
      values: values,
      template: {
        repo: templateRef.repo,
        path: templateRef.path,
        version: templateRef.version,
      },
    },
  );
}

export async function getHelmReleaseResources(
  releaseNamespace: string,
  releaseName: string,
): Promise<any> {
  const resp = await axios.get(
    `/api/helm/releases/${releaseNamespace}/${releaseName}/resources`,
  );
  return resp.data;
}

export async function uninstallHelmRelease(
  releaseNamespace: string,
  releaseName: string,
) {
  return await axios.delete(
    `/api/helm/releases/${releaseNamespace}/${releaseName}`,
  );
}
