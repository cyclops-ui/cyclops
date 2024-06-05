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

export function findMaps(fields: any[], values: any, initialValues: any): any {
  let out: any = initialValues ? initialValues : {};
  fields.forEach((field) => {
    let valuesList: any[] = [];
    switch (field.type) {
      case "string":
        out[field.name] = values[field.name];
        break;
      case "number":
        out[field.name] = values[field.name];
        break;
      case "boolean":
        out[field.name] = values[field.name];
        break;
      case "object":
        if (values[field.name]) {
          out[field.name] = findMaps(
            field.properties,
            values[field.name],
            initialValues[field.name],
          );
        }
        break;
      case "array":
        valuesList = values[field.name] as any[];

        if (!valuesList) {
          out[field.name] = [];
          break;
        }

        let objectArr: any[] = [];
        valuesList.forEach((valueFromList) => {
          switch (field.items.type) {
            case "string":
              objectArr.push(valueFromList);
              break;
            case "object":
              objectArr.push(
                findMaps(
                  field.items.properties,
                  valueFromList,
                  initialValues[field.name],
                ),
              );
              break;
          }
        });
        out[field.name] = objectArr;
        break;
      case "map":
        valuesList = values[field.name] as any[];

        if (!valuesList) {
          out[field.name] = {};
          break;
        }

        let object: any = {};
        valuesList.forEach((valueFromList) => {
          object[valueFromList.key] = valueFromList.value;
        });
        out[field.name] = object;
        break;
    }
  });

  return out;
}
