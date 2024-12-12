import axios from "axios";

export async function getHelmRelease(
  releaseNamespace: string,
  releaseName: string,
): Promise<any> {
  const resp = await axios.get(
    `/api/helm/releases/` + releaseNamespace + "/" + releaseName,
  );
  return resp.data;
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
