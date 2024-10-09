import YAML from "yaml";

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

  if (!fields) {
    return out;
  }

  fields.forEach((field) => {
    let valuesList: any[] = [];
    switch (field.type) {
      case "string":
        if (values[field.name]) {
          out[field.name] = values[field.name];
        }
        break;
      case "number":
        if (values[field.name]) {
          out[field.name] = values[field.name];
        }
        break;
      case "boolean":
        if (values[field.name] !== undefined && values[field.name] !== null) {
          out[field.name] = values[field.name];
        }
        break;
      case "object":
        if (values[field.name]) {
          out[field.name] = findMaps(
            field.properties,
            values[field.name],
            initialValues ? initialValues[field.name] : {},
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
        valuesList.forEach((valueFromList, index) => {
          if (field.items === null || field.items === undefined) {
            objectArr.push(valueFromList);
            return;
          }

          switch (field.items.type) {
            case "string":
              objectArr.push(valueFromList);
              break;
            case "object":
              objectArr.push(
                findMaps(
                  field.items.properties,
                  valueFromList,
                  getObjectArrayInitialValue(initialValues, field.name, index),
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
          object[valueFromList.key] = YAML.parse(valueFromList.value);
        });
        out[field.name] = object;
        break;
    }
  });

  return out;
}

export const mapsToArray = (fields: any[], values: any): any => {
  let out: any = {};

  if (!fields) {
    return out;
  }

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
          out[field.name] = mapsToArray(field.properties, values[field.name]);
        }
        break;
      case "array":
        if (values[field.name] === undefined || values[field.name] === null) {
          out[field.name] = [];
          break;
        }

        valuesList = [];
        if (Array.isArray(values[field.name])) {
          valuesList = values[field.name];
        } else if (typeof values[field.name] === "string") {
          valuesList = [values[field.name]];
        }

        let objectArr: any[] = [];
        valuesList.forEach((valueFromList) => {
          // array items not defined
          if (field.items === null || field.items === undefined) {
            objectArr.push(valueFromList);
            return;
          }

          switch (field.items.type) {
            case "string":
              objectArr.push(valueFromList);
              break;
            case "object":
              objectArr.push(
                mapsToArray(field.items.properties, valueFromList),
              );
              break;
          }
        });
        out[field.name] = objectArr;
        break;
      case "map":
        let object: any[] = [];

        if (values[field.name] === undefined || values[field.name] === null) {
          out[field.name] = [];
          break;
        }

        Object.keys(values[field.name]).forEach((key) => {
          if (typeof values[field.name][key] === "object") {
            object.push({
              key: key,
              value: YAML.stringify(values[field.name][key], null, 4),
            });
            return;
          }

          object.push({
            key: key,
            value: values[field.name][key],
          });
        });

        out[field.name] = object;
        break;
    }
  });

  return out;
};

function getObjectArrayInitialValue(
  initialValue: any,
  name: string,
  index: number,
): any | null {
  if (initialValue === null || initialValue === undefined) {
    return null;
  }

  if (initialValue[name] === null || initialValue[name] === undefined) {
    return null;
  }

  if (
    Array.isArray(initialValue[name]) &&
    index >= 0 &&
    index < initialValue[name].length
  ) {
    return initialValue[name][index];
  }
  return null;
}
