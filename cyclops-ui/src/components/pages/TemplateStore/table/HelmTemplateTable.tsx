import { Spin, Table } from "antd";
import defaultTemplate from "../../../../static/img/default-template-icon.png";
import {
  DeleteOutlined,
  EditOutlined,
  FileSyncOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import React from "react";

interface HelmTemplateTableProps {
  templateStores: any[];
  loadingTemplateName: { [key: string]: boolean };
  requestStatus: { [key: string]: string };
  checkTemplateReference: (
    repo: string,
    path: string,
    version: string,
    name: string,
    sourceType: string,
  ) => void;
  onEditTemplate: (template: any) => void;
  onDeleteTemplate: (template: any) => void;
}

const HelmTemplateTable = ({
  templateStores,
  loadingTemplateName,
  requestStatus,
  checkTemplateReference,
  onEditTemplate,
  onDeleteTemplate,
}: HelmTemplateTableProps) => {
  return (
    <Table dataSource={templateStores}>
      <Table.Column
        dataIndex="iconURL"
        width={"3%"}
        render={function (iconURL) {
          if (!iconURL || iconURL.length === 0) {
            return (
              <img
                alt=""
                style={{
                  verticalAlign: "middle",
                  margin: "-5px",
                  maxHeight: "36px",
                }}
                src={defaultTemplate}
              />
            );
          }

          return (
            <img
              alt=""
              style={{
                verticalAlign: "middle",
                margin: "-5px",
                maxHeight: "36px",
              }}
              src={iconURL}
            />
          );
        }}
      />
      <Table.Column title="Name" dataIndex="name" width={"20%"} />
      <Table.Column title="Repo" dataIndex={["ref", "repo"]} width={"30%"} />
      <Table.Column
        title="Path"
        dataIndex={["ref", "path"]}
        width={"20%"}
        render={function (value: any, record: any, index: number) {
          if (!value.startsWith("/")) {
            return "/" + value;
          }
          return value;
        }}
      />
      <Table.Column
        title="Version"
        dataIndex={["ref", "version"]}
        width={"10%"}
        render={function (value: any, record: any, index: number) {
          if (String(value).length === 0) {
            return <span style={{ color: "#A0A0A0" }}>{"<default>"}</span>;
          }
          return value;
        }}
      />
      <Table.Column
        title="Validate"
        width="5%"
        render={(template) => (
          <>
            {loadingTemplateName[template.name] === true ? (
              <Spin />
            ) : (
              <FileSyncOutlined
                className={classNames("statustemplate", {
                  success: requestStatus[template.name] === "success",
                  error: requestStatus[template.name] === "error",
                })}
                onClick={function () {
                  checkTemplateReference(
                    template.ref.repo,
                    template.ref.path,
                    template.ref.version,
                    template.name,
                    template.ref.sourceType,
                  );
                }}
              />
            )}
          </>
        )}
      />
      <Table.Column
        title="Edit"
        width="5%"
        render={(template) => (
          <>
            <EditOutlined
              className={"edittemplate"}
              // onClick={function () {
              //     editForm.setFieldValue(
              //         ["ref", "sourceType"],
              //         template.ref.sourceType,
              //     );
              //     editForm.setFieldValue(["ref", "repo"], template.ref.repo);
              //     editForm.setFieldValue(["ref", "path"], template.ref.path);
              //     editForm.setFieldValue(
              //         ["ref", "version"],
              //         template.ref.version,
              //     );
              //     setEditModal(template.name);
              // }}
              onClick={() => {
                onEditTemplate(template);
              }}
            />
          </>
        )}
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

export default HelmTemplateTable;
