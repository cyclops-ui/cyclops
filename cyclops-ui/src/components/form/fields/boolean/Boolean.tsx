import React from "react";
import { Form, Switch } from "antd";

interface Props {
  field: any;
  fieldName: string;
  value: any;
}

export function getValueFromNestedObject(obj: any, keys: string[]): any {
  let currentObj = obj;

  for (const key of keys) {
    if (
      typeof currentObj === "object" &&
      currentObj !== null &&
      key in currentObj
    ) {
      currentObj = currentObj[key];
    } else {
      return false;
    }
  }

  return currentObj;
}

export const Boolean = ({ field, fieldName, value }: Props) => {
  const mapValue = (v: any) => {
    return v === true ? "checked" : "unchecked";
  };

  return (
    <Form.Item
      initialValue={field.initialValue}
      name={fieldName}
      id={fieldName}
      valuePropName={mapValue(value)}
      style={{
        paddingTop: "8px",
        marginBottom: "12px",
      }}
      label={
        <div>
          {field.display_name}
          <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
            {field.description}
          </p>
        </div>
      }
    >
      <Switch />
    </Form.Item>
  );
};
