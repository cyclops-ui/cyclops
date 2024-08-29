import React, { useState } from "react";
import { Col, Divider, Collapse, Input, Form } from "antd";
import "./custom.css";
import { isArray } from "node:util";

const ModuleMeta = () => {
  const [collapseOpened, setCollapseOpened] = useState(false);

  const metadataCollapseColor = () => {
    if (collapseOpened) {
      return "#faca93";
    } else {
      return "#fae8d4";
    }
  };

  return (
    <Col span={16} style={{ padding: 0 }}>
      <Collapse
        size="small"
        bordered={false}
        style={{ padding: 0 }}
        onChange={function (value: string | string[]) {
          if (Array.isArray(value)) {
            setCollapseOpened(value.includes("metadata"));
            return;
          }

          setCollapseOpened(value === "metadata");
        }}
      >
        <Collapse.Panel
          key={"metadata"}
          header={"Advanced"}
          forceRender={true}
          style={{
            borderRadius: "7px",
            backgroundColor: metadataCollapseColor(),
          }}
        >
          <Form.Item
            name="cyclops_module_namespace"
            id="cyclops_module_namespace"
            label={
              <div>
                Deploy to namespace
                <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                  All resources will be by default deployed to the selected
                  namespace
                </p>
              </div>
            }
          >
            <Input />
          </Form.Item>
        </Collapse.Panel>
      </Collapse>
    </Col>
  );
};

export default ModuleMeta;
