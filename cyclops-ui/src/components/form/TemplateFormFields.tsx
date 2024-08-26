import React from "react";
import SelectInput from "./fields/string/SelectInput";
import File from "./fields/string/File";
import { Boolean, getValueFromNestedObject } from "./fields/boolean/Boolean";
import { Number } from "./fields/number/Number";
import StringField from "./fields/string/String";
import { ArrayField } from "./fields/array/ArrayField";
import { ObjectField } from "./fields/object/ObjectField";
import { MapField } from "./fields/map/MapField";

interface Props {
  fields: any[];
  parentFieldID: string[];
  parent: string;
  level: number;
  arrayIndexLifetime: number;
  arrayField?: any;
  required?: string[];
  initialFields: any;
}

export function mapFields(
  fields: any[],
  initialValues: any,
  parentFieldID: string[],
  parent: string,
  level: number,
  arrayIndexLifetime: number,
  arrayField?: any,
  required?: string[],
) {
  const formFields: {} | any = [];

  if (!fields) {
    return <></>;
  }

  fields.forEach((field: any) => {
    let fieldName = field.name;

    let formItemName = arrayField ? [arrayField.name, fieldName] : fieldName;

    let uniqueFieldName: string[] =
      parentFieldID.length === 0
        ? [field.name]
        : [...parentFieldID, field.name];

    let isRequired = false;

    if (required) {
      for (let r of required) {
        if (r === field.name) {
          isRequired = true;
          break;
        }
      }
    }

    if (arrayIndexLifetime > 0) {
      arrayIndexLifetime = arrayIndexLifetime - 1;
    }

    switch (field.type) {
      case "string":
        if (field.enum) {
          formFields.push(
            <SelectInput
              field={field}
              formItemName={formItemName}
              arrayField={arrayField}
              isRequired={isRequired}
            />,
          );
          return;
        }

        if (field.fileExtension && field.fileExtension.length > 0) {
          formFields.push(
            <File
              field={field}
              formItemName={formItemName}
              arrayField={arrayField}
              isRequired={isRequired}
            />,
          );
          return;
        }

        formFields.push(
          <StringField
            field={field}
            formItemName={formItemName}
            arrayField={arrayField}
            isRequired={isRequired}
          />,
        );
        return;
      case "number":
        formFields.push(
          <Number
            field={field}
            arrayField={arrayField}
            formItemName={formItemName}
            isRequired={isRequired}
          />,
        );
        return;
      case "boolean":
        let k = [];
        for (const item of parentFieldID) {
          if (item === "") {
            continue;
          }

          k.push(item);
        }
        k.push(fieldName);

        formFields.push(
          <Boolean
            field={field}
            fieldName={fieldName}
            value={getValueFromNestedObject(initialValues, k)}
          />,
        );
        return;
      case "object":
        formFields.push(
          <ObjectField
            field={field}
            arrayField={arrayField}
            fieldName={fieldName}
            level={level}
            formItemName={formItemName}
            initialValues={initialValues}
            uniqueFieldName={uniqueFieldName}
            arrayIndexLifetime={arrayIndexLifetime}
          />,
        );
        return;
      case "array":
        formFields.push(
          <ArrayField
            field={field}
            fieldName={fieldName}
            level={level}
            formItemName={formItemName}
            initialValues={initialValues}
            uniqueFieldName={uniqueFieldName}
          />,
        );
        return;
      case "map":
        formFields.push(
          <MapField
            field={field}
            fieldName={fieldName}
            level={level}
            formItemName={formItemName}
            isRequired={isRequired}
          />,
        );
    }
  });

  return formFields;
}

const TemplateFormFields = ({
  fields,
  initialFields,
  parentFieldID,
  parent,
  level,
  arrayIndexLifetime,
  arrayField,
  required,
}: Props) => {
  return (
    <div>
      {mapFields(
        fields,
        initialFields,
        parentFieldID,
        parent,
        level,
        arrayIndexLifetime,
        arrayField,
        required,
      )}
    </div>
  );
};

export default TemplateFormFields;
