import React from "react";
import { Form, InputNumber } from "antd";
import { numberInputValidators } from "../../../../utils/validators/number";

interface Props {
  field: any;
  arrayField: any;
  formItemName: string;
  isRequired: boolean;
  isModuleEdit: boolean;
}

export const NumberField = ({
  field,
  arrayField,
  formItemName,
  isRequired,
  isModuleEdit,
}: Props) => {
  let numberValidationRules = numberInputValidators(field, isRequired);

  return (
    <Form.Item
      {...arrayField}
      initialValue={field.initialValue}
      name={formItemName}
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
      hasFeedback={numberValidationRules.length > 0}
      validateDebounce={1000}
      rules={numberValidationRules}
    >
      <InputNumber
        style={{ width: "100%" }}
        disabled={field.immutable && isModuleEdit}
      />
    </Form.Item>
  );
};
