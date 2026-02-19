import React, { useState } from "react";
import {
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  Row,
  Tooltip,
} from "antd";
import {
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { mapFields } from "../../TemplateFormFields";
import { collapseColor } from "../utils";
import { useTemplateFormFields } from "../../TemplateFormFieldsContext";

interface Props {
  field: any;
  fieldName: string;
  level: number;
  formItemName: string;
  isRequired: boolean;
  initialValues?: any;
  uniqueFieldName?: string[];
  isModuleEdit?: boolean;
}

const FlatMapField = ({
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
              border: "solid 1px",
              borderColor: themePalette === "dark" ? "#444" : "#d3d3d3",
              borderRadius: "7px",
              padding: "12px",
              width: "100%",
              backgroundColor: themePalette === "dark" ? "#333" : "#fafafa",
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

const StructuredMapField = ({
  field,
  fieldName,
  level,
  formItemName,
  isRequired,
  initialValues,
  uniqueFieldName,
  isModuleEdit,
}: Props) => {
  const { themePalette } = useTemplateFormFields();
  const [open, setOpen] = useState(false);

  const ap = field.additionalProperties;

  let header = <Row>{field.display_name}</Row>;
  if (field.description && field.description.length !== 0) {
    header = (
      <Row gutter={[0, 8]}>
        <Col
          span={15}
          style={{ display: "flex", justifyContent: "flex-start" }}
        >
          {field.display_name}
        </Col>
        <Col span={9} style={{ display: "flex", justifyContent: "flex-end" }}>
          <Tooltip title={field.description} trigger={["hover", "click"]}>
            <InfoCircleOutlined style={{ right: "0px", fontSize: "20px" }} />
          </Tooltip>
        </Col>
      </Row>
    );
  }

  return (
    <Col
      span={level === 0 ? 16 : 24}
      offset={level === 0 ? 2 : 0}
      style={{
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingLeft: "0px",
        paddingRight: "0px",
        marginLeft: "0px",
        marginRight: "0px",
      }}
    >
      <Collapse
        size={"small"}
        bordered={false}
        onChange={function (value: string | string[]) {
          setOpen(value.length > 0);
        }}
      >
        <Collapse.Panel
          key={fieldName}
          header={header}
          style={{
            borderRadius: "7px",
            backgroundColor: collapseColor(open, themePalette),
          }}
          forceRender={true}
        >
          <Form.Item
            wrapperCol={{ span: 16 }}
            style={{
              paddingTop: "8px",
              marginBottom: "0",
            }}
          >
            <Form.List name={formItemName}>
              {(arrFields, { add, remove }) => (
                <>
                  {arrFields.map((arrField) => (
                    <Col
                      key={arrField.key}
                      style={{ padding: 0, paddingBottom: "12px" }}
                    >
                      <div
                        style={{
                          border: "solid 1.5px #c3c3c3",
                          borderRadius: "7px",
                          padding: "12px",
                          width: "100%",
                          backgroundColor:
                            themePalette === "dark" ? "#444" : "#fafafa",
                        }}
                      >
                        <Form.Item
                          name={[arrField.name, "key"]}
                          label="Name"
                          rules={[
                            { required: true, message: "Key name is required" },
                          ]}
                          style={{ marginBottom: "8px" }}
                        >
                          <Input placeholder="Enter key name" />
                        </Form.Item>
                        {mapFields(
                          isModuleEdit || false,
                          ap.properties,
                          initialValues,
                          [...(uniqueFieldName || []), String("")],
                          "",
                          level + 1,
                          2,
                          arrField,
                          ap.required,
                        )}
                        <MinusCircleOutlined
                          style={{ fontSize: "16px" }}
                          onClick={() => remove(arrField.name)}
                        />
                      </div>
                    </Col>
                  ))}
                  <Form.Item style={{ marginBottom: "0" }}>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Collapse.Panel>
      </Collapse>
    </Col>
  );
};

export const MapField = (props: Props) => {
  const hasStructuredValues =
    props.field.additionalProperties?.properties?.length > 0;

  if (hasStructuredValues) {
    return <StructuredMapField {...props} />;
  }
  return <FlatMapField {...props} />;
};
