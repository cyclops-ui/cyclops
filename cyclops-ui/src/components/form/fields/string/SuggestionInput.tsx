import React, { useState } from "react";
import { Button, Col, Divider, Form, Input, Row, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";

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

export const SuggestionInputField = ({
  field,
  formItemName,
  arrayField,
  isRequired,
  isModuleEdit,
}: Props) => {
  const [suggestedOptions, setSuggestedOptions] = useState<Option[]>([]);
  const [newOption, setNewOption] = useState("");

  const selectOptions = (field: any) => {
    let options: Option[] = [];

    if (!field || !field["x-suggestions"]) {
      return options;
    }

    field["x-suggestions"].forEach((option: any) => {
      options.push({
        value: option,
        label: option,
      });
    });

    return options;
  };

  const addNewOption = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    if (
      newOption !== "" &&
      !suggestedOptions.find((option) => option.label === newOption) &&
      !selectOptions(field).find((option) => option.label === newOption)
    ) {
      setSuggestedOptions((prev) => [
        ...prev,
        { value: newOption, label: newOption },
      ]);
      setNewOption("");
    }
  };

  const addOptionOnEnter = () => {
    if (newOption !== "") {
      setSuggestedOptions((prev) => [
        ...prev,
        { value: newOption, label: newOption },
      ]);
      setNewOption("");
    }
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
        onSearch={(value) => {
          setNewOption(value);
        }}
        filterOption={(input, option) => {
          return (option?.label ?? "")
            .toLowerCase()
            .includes(input.toLowerCase());
        }}
        options={[...selectOptions(field), ...suggestedOptions]}
        disabled={field.immutable && isModuleEdit}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "8px 0" }} />
            <Row>
              <Col span={16}>
                <Input
                  placeholder="Enter New Option"
                  value={newOption}
                  onChange={(event) => setNewOption(event.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      addOptionOnEnter();
                    }
                  }}
                />
              </Col>
              <Col span={8}>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={addNewOption}
                >
                  Add New Option
                </Button>
              </Col>
            </Row>
          </>
        )}
      />
    </Form.Item>
  );
};
