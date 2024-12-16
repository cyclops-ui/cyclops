import React from "react";
import { Button, Col, Divider, Form, Input, Row } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { useTemplateFormFields } from "../../TemplateFormFieldsContext";

interface Props {
  field: any;
  fieldName: string;
  level: number;
  formItemName: string;
  isRequired: boolean;
}

export const MapField = ({
  field,
  fieldName,
  level,
  formItemName,
  isRequired,
}: Props) => {
  const { themePalette } = useTemplateFormFields();

  return (
    <Form.Item
      wrapperCol={{ span: level === 0 ? 16 : 24 }}
      name={fieldName}
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
      <Form.List name={formItemName} initialValue={[]}>
        {(fields, { add, remove }) => (
          <div
            style={{
              border: "solid 1px #d3d3d3",
              borderRadius: "7px",
              padding: "12px",
              width: "100%",
              backgroundColor: themePalette === "dark" ? "#444" : "#fafafa",
            }}
          >
            {fields.map((arrField, index) => (
              <Row
                key={arrField.key}
                style={{
                  display: "flex",
                  marginBottom: 8,
                  width: "100%",
                }}
              >
                <Col span={10}>
                  <Form.Item
                    {...arrField}
                    name={[arrField.name, "key"]}
                    rules={[{ required: true, message: "Missing key" }]}
                    style={{ margin: 0, flex: 1, marginRight: "8px" }}
                  >
                    <Input style={{ margin: 0, width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item
                    {...arrField}
                    name={[arrField.name, "value"]}
                    rules={[{ required: true, message: "Missing value" }]}
                    style={{ margin: 0, flex: 1, marginRight: "12px" }}
                  >
                    <TextArea style={{ margin: 0 }} rows={1} />
                  </Form.Item>
                </Col>
                <MinusCircleOutlined onClick={() => remove(arrField.name)} />
                {fields !== null &&
                fields !== undefined &&
                index + 1 === fields.length ? (
                  <Divider style={{ marginTop: "12px", marginBottom: "4px" }} />
                ) : (
                  ""
                )}
              </Row>
            ))}
            <Col span={24}>
              <Form.Item style={{ marginBottom: "0" }}>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                  }}
                  block
                  icon={<PlusOutlined />}
                >
                  Add
                </Button>
              </Form.Item>
            </Col>
          </div>
        )}
      </Form.List>
    </Form.Item>
  );
};
