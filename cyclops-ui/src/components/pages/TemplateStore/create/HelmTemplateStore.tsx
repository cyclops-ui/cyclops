import { Form, Input, Radio } from "antd";
import gitLogo from "../../../../static/img/git.png";
import helmLogo from "../../../../static/img/helm.png";
import dockerLogo from "../../../../static/img/docker-mark-blue.png";
import React from "react";

interface HelmTemplateStoreProps {
  active: boolean;
}

export const HelmTemplateStore = ({ active }: HelmTemplateStoreProps) => {
  return (
    <div>
      <Form.Item name={["ref", "sourceType"]} label="Select template source">
        <Radio.Group
          optionType="button"
          style={{ width: "100%" }}
          className={"templatetypes"}
        >
          <Radio value="git" className={"templatetype"}>
            <img src={gitLogo} alt="git" className={"templatetypeicon"} />
            Git
          </Radio>
          <Radio value="helm" className={"templatetype"}>
            <img src={helmLogo} alt="helm" className={"templatetypeicon"} />
            Helm repo
          </Radio>
          <Radio value="oci" className={"templatetype"}>
            <img src={dockerLogo} alt="docker" className={"templatetypeicon"} />
            OCI registry
          </Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        label="Repository URL"
        name={["ref", "repo"]}
        rules={[{ required: active, message: "Repo URL is required" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Path"
        name={["ref", "path"]}
        rules={[{ required: active, message: "Path is required" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Version" name={["ref", "version"]}>
        <Input />
      </Form.Item>
    </div>
  );
};
