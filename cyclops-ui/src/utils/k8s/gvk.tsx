export function gvkString(group: string, version: string, kind: string) {
  if (group === "") {
    return version + " " + kind;
  }

  return group + "/" + version + " " + kind;
}
