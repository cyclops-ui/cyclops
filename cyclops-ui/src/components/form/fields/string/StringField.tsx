import React, { useState } from "react";
import { Form, Input } from "antd";
import { stringInputValidators } from "./validators";
import { resolveConditions } from "../../../../utils/conditionalFields";

interface Props {
  field: any;
  formItemName: string | string[];
  arrayField: any;
  isRequired: boolean;
  isModuleEdit: boolean;
}

const StringField = ({
  field,
  formItemName,
  arrayField,
  isRequired,
  isModuleEdit,
}: Props) => {
  const [display, setDisplay] = useState(!field.condition);

  const stringValidationRules = stringInputValidators(field, isRequired);

  const shouldUpdate = (prevValues, curValues) => {
    if (!field.condition || field.condition.length === 0) {
      return false;
    }

    let shouldDisplay = resolveConditions(field.condition, curValues);
    if (shouldDisplay !== display) {
      setDisplay(shouldDisplay);
      return true;
    }

    return false;
  };

  return (
    <Form.Item
      {...arrayField}
      name={formItemName}
      shouldUpdate={
        !field.condition || field.condition.length === 0 ? false : shouldUpdate
      }
      style={{ paddingTop: "8px", marginBottom: "12px" }}
      label={
        <div>
          {field.display_name}
          <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
            {field.description}
          </p>
        </div>
      }
      hasFeedback={stringValidationRules.length > 0}
      validateDebounce={1000}
      rules={stringValidationRules}
      hidden={!display}
    >
      <Input disabled={field.immutable && isModuleEdit} />
    </Form.Item>
  );
};

export default StringField;
