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
  Checkbox,
  InputNumber,
} from "antd";
import {
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { mapFields } from "../../TemplateFormFields";
import { collapseColor } from "../utils";

interface Props {
  field: any;
  fieldName: string;
  level: number;
  formItemName: string;
  initialValues: any;
  uniqueFieldName: string[];
  isModuleEdit: boolean;
}

export const ArrayField = ({
  field,
  fieldName,
  level,
  formItemName,
  initialValues,
  uniqueFieldName,
  isModuleEdit,
}: Props) => {
  const [open, setOpen] = useState(false);

  let header = <Row>{field.name}</Row>;

  if (field.description && field.description.length !== 0) {
    header = (
      <Row gutter={[0, 8]}>
        <Col
          span={15}
          style={{ display: "flex", justifyContent: "flex-start" }}
        >
          {field.name}
        </Col>
        <Col span={9} style={{ display: "flex", justifyContent: "flex-end" }}>
          <Tooltip title={field.description} trigger={["hover", "click"]}>
            <InfoCircleOutlined style={{ right: "0px", fontSize: "20px" }} />
          </Tooltip>
        </Col>
      </Row>
    );
  }

  const arrayInnerField = (
    fieldName: string,
    uniqueFieldName: string[],
    formItemName: any,
    field: any,
    level: number,
    header: React.JSX.Element,
    initialFields: any,
  ) => {
    if (!field.items || field.items.type === "string") {
      return (
        <Form.Item
          wrapperCol={{ span: level === 0 ? 16 : 24 }}
          name={fieldName}
          style={{
            paddingTop: "0px",
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
          <Form.List name={formItemName}>
            {(arrFields, { add, remove }) => (
              <div
                style={{
                  border: "solid 1px #d3d3d3",
                  borderRadius: "7px",
                  padding: "12px",
                  width: "100%",
                  backgroundColor: "#fafafa",
                }}
              >
                {arrFields.map((arrField, index) => (
                  <Col key={arrField.key}>
                    <Row>
                      <Form.Item
                        style={{
                          paddingBottom: "8px",
                          marginBottom: "0px",
                          width: "80%",
                        }}
                        wrapperCol={{ span: 24 }}
                        {...arrField}
                        initialValue={field.initialValue}
                        name={[arrField.name]}
                      >
                        <Input disabled={field.immutable && isModuleEdit} />
                      </Form.Item>
                      <MinusCircleOutlined
                        style={{ fontSize: "16px", paddingLeft: "10px" }}
                        onClick={() => remove(arrField.name)}
                      />
                    </Row>
                    {index + 1 === arrFields.length ? (
                      <Divider
                        style={{ marginTop: "4px", marginBottom: "12px" }}
                      />
                    ) : null}
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
              </div>
            )}
          </Form.List>
        </Form.Item>
      );
    }

    if (field.items.type === "number") {
      return (
        <Form.Item
          wrapperCol={{ span: 16 }}
          name={fieldName}
          label={field.display_name}
          style={{ marginBottom: "12px" }}
        >
          <Form.List name={formItemName}>
            {(arrFields, { add, remove }) => (
              <div
                style={{
                  border: "solid 1px #d3d3d3",
                  borderRadius: "7px",
                  padding: "12px",
                  width: "100%",
                  backgroundColor: "#fafafa",
                }}
              >
                {arrFields.map((arrField, index) => (
                  <Col key={arrField.key}>
                    <Row>
                      <Form.Item
                        style={{
                          paddingBottom: "8px",
                          marginBottom: "0px",
                          width: "80%",
                        }}
                        wrapperCol={{ span: 24 }}
                        {...arrField}
                        name={[arrField.name]}
                      >
                        <InputNumber
                          disabled={field.immutable && isModuleEdit}
                        />
                      </Form.Item>
                      <MinusCircleOutlined
                        style={{ fontSize: "16px", paddingLeft: "10px" }}
                        onClick={() => remove(arrField.name)}
                      />
                    </Row>
                    {index + 1 === arrFields.length ? (
                      <Divider
                        style={{ marginTop: "4px", marginBottom: "12px" }}
                      />
                    ) : null}
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
              </div>
            )}
          </Form.List>
        </Form.Item>
      );
    }

    if (field.items.type === "boolean") {
      return (
        <Form.Item
          wrapperCol={{ span: 16 }}
          name={fieldName}
          label={field.display_name}
          style={{ marginBottom: "12px" }}
        >
          <Form.List name={formItemName}>
            {(arrFields, { add, remove }) => (
              <div
                style={{
                  border: "solid 1px #d3d3d3",
                  borderRadius: "7px",
                  padding: "12px",
                  width: "100%",
                  backgroundColor: "#fafafa",
                }}
              >
                {arrFields.map((arrField, index) => (
                  <Col key={arrField.key}>
                    <Row>
                      <Form.Item
                        style={{
                          paddingBottom: "8px",
                          marginBottom: "0px",
                          width: "80%",
                        }}
                        wrapperCol={{ span: 24 }}
                        {...arrField}
                        name={[arrField.name]}
                        valuePropName="checked"
                      >
                        <Checkbox disabled={field.immutable && isModuleEdit}>
                          {field.display_name}
                        </Checkbox>
                      </Form.Item>
                      <MinusCircleOutlined
                        style={{ fontSize: "16px", paddingLeft: "10px" }}
                        onClick={() => remove(arrField.name)}
                      />
                    </Row>
                    {index + 1 === arrFields.length ? (
                      <Divider
                        style={{ marginTop: "4px", marginBottom: "12px" }}
                      />
                    ) : null}
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
              </div>
            )}
          </Form.List>
        </Form.Item>
      );
    }

    if (field.items.type === "object") {
      return (
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
              backgroundColor: collapseColor(open),
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
                            backgroundColor: "#fafafa",
                          }}
                        >
                          {mapFields(
                            isModuleEdit,
                            field.items.properties,
                            initialFields,
                            [...uniqueFieldName, String("")],
                            "",
                            level + 1,
                            2,
                            arrField,
                            field.items.required,
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
      );
    }
  };

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
      {arrayInnerField(
        fieldName,
        uniqueFieldName,
        formItemName,
        field,
        level + 1,
        header,
        initialValues,
      )}
    </Col>
  );
};
