import React from "react";
import StringField from "./fields/string/StringField";
import { ArrayField } from "./fields/array/ArrayField";
import { ObjectField } from "./fields/object/ObjectField";
import { MapField } from "./fields/map/MapField";
import { SelectInputField } from "./fields/string/SelectInput";
import { FileField } from "./fields/string/FileField";
import { NumberField } from "./fields/number/Number";
import {
  BooleanField,
  getValueFromNestedObject,
} from "./fields/boolean/Boolean";
import { Alert, Row } from "antd";
import { WarningTwoTone } from "@ant-design/icons";
import Link from "antd/lib/typography/Link";
import { SuggestionInputField } from "./fields/string/SuggestionInput";
import "./custom.css";

interface Props {
  isModuleEdit: boolean;
  fields: any[];
  parentFieldID: string[];
  parent: string;
  level: number;
  arrayIndexLifetime: number;
  arrayField?: any;
  required: string[];
  initialValues: any;
}

export function mapFields(
  isModuleEdit: boolean,
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
            <SelectInputField
              field={field}
              formItemName={formItemName}
              arrayField={arrayField}
              isRequired={isRequired}
              isModuleEdit={isModuleEdit}
            />,
          );
          return;
        }
        if (field["x-suggestions"]) {
          formFields.push(
            <SuggestionInputField
              field={field}
              formItemName={formItemName}
              arrayField={arrayField}
              isRequired={isRequired}
              isModuleEdit={isModuleEdit}
            />,
          );
          return;
        }

        if (field.fileExtension && field.fileExtension.length > 0) {
          formFields.push(
            <FileField
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
            isModuleEdit={isModuleEdit}
          />,
        );
        return;
      case "number":
        formFields.push(
          <NumberField
            field={field}
            arrayField={arrayField}
            formItemName={formItemName}
            isRequired={isRequired}
            isModuleEdit={isModuleEdit}
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
          <BooleanField
            field={field}
            fieldName={fieldName}
            value={getValueFromNestedObject(initialValues, k)}
            isModuleEdit={isModuleEdit}
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
            isModuleEdit={isModuleEdit}
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
            isModuleEdit={isModuleEdit}
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

const NoFieldsAlert = () => {
  const valuesSchema = () => {
    return (
      <Link
        href={"https://helm.sh/docs/topics/charts/#schema-files"}
        target={"_blank"}
        style={{
          textDecoration: "underline",
          textDecorationColor: "#555",
        }}
      >
        <code style={{ backgroundColor: "#fff", color: "#555" }}>
          values.schema.json
        </code>
      </Link>
    );
  };

  const generateSchemaDocs = () => {
    return (
      <Link
        href={
          "https://cyclops-ui.com/docs/templates/#generating-helm-chart-schema"
        }
        target={"_blank"}
        style={{
          textDecoration: "underline",
          textDecorationColor: "#555",
        }}
      >
        here.
      </Link>
    );
  };

  return (
    <Alert
      message={
        <div>
          <WarningTwoTone
            twoToneColor="#f3801a"
            style={{
              paddingRight: "5px",
              fontSize: "24px",
              verticalAlign: "middle",
            }}
          />
          No fields to render
        </div>
      }
      closable={true}
      description={
        <div>
          <Row>
            <span>
              Selected template contains no fields to render. You can still
              install this Helm chart with it's default values, but in order to
              update the values, make sure to add {valuesSchema()}.
            </span>
          </Row>
          <Row>
            <span>
              You can generate your Helm chart schema and add it to your chart
              by following our docs {generateSchemaDocs()}
            </span>
          </Row>
        </div>
      }
      type="warning"
      style={{
        borderColor: "#ffc403",
        borderWidth: "1.5px",
        marginBottom: "16px",
      }}
    />
  );
};

const TemplateFormFields = ({
  isModuleEdit,
  fields,
  initialValues,
  parentFieldID,
  parent,
  level,
  arrayIndexLifetime,
  arrayField,
  required,
}: Props) => {
  if (!fields) {
    return <NoFieldsAlert />;
  }

  return (
    <div>
      {mapFields(
        isModuleEdit,
        fields,
        initialValues,
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
