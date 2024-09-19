import React from "react";
import { Form, Select } from "antd";

interface Option {
  value: string;
  label: string;
}

interface Props {
  field: any;
  formItemName: string | string[];
  arrayField: any;
  isRequired: boolean;
  isModuleEdit: boolean;
}

export const SelectInputField = ({
  field,
  formItemName,
  arrayField,
  isRequired,
  isModuleEdit,
}: Props) => {
  const selectOptions = (field: any) => {
    let options: Option[] = [];

    if (!field || !field.enum) {
      return options;
    }

    field.enum.forEach((option: any) => {
      options.push({
        value: option,
        label: option,
      });
    });

    return options;
  };

  return (
    <Form.Item
      {...arrayField}
      name={formItemName}
      rules={[{ required: isRequired }]}
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
      <Select
        showSearch
        placeholder={field.name}
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        options={selectOptions(field)}
        disabled={field.immutable && isModuleEdit}
      />
    </Form.Item>
  );
};
