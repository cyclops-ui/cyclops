import React from "react";
import { Form, Input } from "antd";
import { stringInputValidators } from "../../../../utils/validators/string";

interface Props {
  field: any;
  formItemName: string | string[];
  arrayField: any;
  isRequired: boolean;
}

const StringField = ({
  field,
  formItemName,
  arrayField,
  isRequired,
}: Props) => {
  let stringValidationRules = stringInputValidators(field, isRequired);

  return (
    <Form.Item
      {...arrayField}
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
      hasFeedback={stringValidationRules.length > 0}
      validateDebounce={1000}
      rules={stringValidationRules}
    >
      <Input />
    </Form.Item>
  );
};

export default StringField;
