export function isGitHubRepo(repo: string): boolean {
  return repo.startsWith("https://github.com");
}

export function moduleConfigGitRefLink(
  repo: string,
  path: string,
  version: string,
  moduleName: string,
): string {
  return `${repo}/tree/${version}/${path}/${moduleName}.yaml`;
}
