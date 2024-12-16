import React, { useState } from "react";
import { Col, Collapse, Form, Row, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { mapFields } from "../../TemplateFormFields";
import { collapseColor } from "../utils";
import { useTemplateFormFields } from "../../TemplateFormFieldsContext";

import "./custom.css";

interface Props {
  field: any;
  arrayField: any;
  fieldName: string;
  level: number;
  formItemName: string;
  initialValues: any;
  uniqueFieldName: string[];
  arrayIndexLifetime: number;
  isModuleEdit: boolean;
}

export const ObjectField = ({
  field,
  arrayField,
  fieldName,
  level,
  formItemName,
  initialValues,
  uniqueFieldName,
  arrayIndexLifetime,
  isModuleEdit,
}: Props) => {
  const { themePalette } = useTemplateFormFields();

  const [open, setOpen] = useState(false);

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
      className={`nested-fields ${themePalette === "dark" ? "dark" : ""}`}
      style={{
        paddingTop: "8px",
        paddingBottom: "8px",
        marginLeft: "0px",
        marginRight: "0px",
        paddingLeft: "0px",
        paddingRight: "0px",
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
          <Form.List name={formItemName}>
            {(arrFields, { add, remove }) => (
              <>
                {mapFields(
                  isModuleEdit,
                  field.properties,
                  initialValues,
                  uniqueFieldName,
                  "",
                  level + 1,
                  arrayIndexLifetime,
                  arrayIndexLifetime > 0 ? arrayField : undefined,
                  field.required,
                )}
              </>
            )}
          </Form.List>
        </Collapse.Panel>
      </Collapse>
    </Col>
  );
};
