import { Table } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import React from "react";

interface CRDTemplateTableProps {
  templateStores: any[];
  onDeleteTemplate: (template: any) => void;
}

const CRDTemplateTable = ({
  templateStores,
  onDeleteTemplate,
}: CRDTemplateTableProps) => {
  return (
    <Table dataSource={templateStores}>
      <Table.Column
        width={"3%"}
        render={function () {
          return (
            <img
              alt=""
              style={{
                verticalAlign: "middle",
                margin: "-5px",
                maxHeight: "36px",
              }}
              src={
                "https://github.com/kubernetes/community/blob/master/icons/png/resources/labeled/crd-128.png?raw=true"
              }
            />
          );
        }}
      />
      <Table.Column title="Name" dataIndex="name" width={"32%"} />
      <Table.Column
        title="Kubernetes CRD"
        dataIndex={["ref", "crdName"]}
        width={"60%"}
      />
      <Table.Column
        title="Delete"
        width="5%"
        render={(template) => (
          <>
            <DeleteOutlined
              className={"deletetemplate"}
              onClick={() => {
                onDeleteTemplate(template);
              }}
            />
          </>
        )}
      />
    </Table>
  );
};

export default CRDTemplateTable;
