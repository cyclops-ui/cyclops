export function fileExtension(fileExt: string): string {
  switch (fileExt) {
    case "json":
      return "json";
    case "sh":
      return "sh";
    case "yaml":
      return "yaml";
    case "toml":
      return "toml";
    case "javascript":
      return "javascript";
    case "typescript":
      return "typescript";
    default:
      return "text";
  }
}

export function flattenObjectKeys(
  obj: any,
  parentKeys: string[] = [],
): (string | string[])[] {
  return Object.keys(obj).reduce((acc: (string | string[])[], key: string) => {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        acc.push(...flattenObjectKeys(obj[key], [...parentKeys, key]));
      } else {
        acc.push(parentKeys.length > 0 ? [...parentKeys, key] : key);
      }
    }
    return acc;
  }, []);
}
