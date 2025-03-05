import { Alert, Form, Input, Radio, Select } from "antd";
import gitLogo from "../../../../static/img/git.png";
import helmLogo from "../../../../static/img/helm.png";
import dockerLogo from "../../../../static/img/docker-mark-blue.png";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { mapResponseError } from "../../../../utils/api/errors";

interface CRDTemplateStoreProps {
  active: boolean;
}

export const CRDTemplateStore = ({ active }: CRDTemplateStoreProps) => {
  const [error, setError] = useState({
    message: "",
    description: "",
  });
  const [crds, setCrds] = useState<string[]>([]);

  useEffect(() => {
    axios
      .get("/api/crds")
      .then((res) => {
        setCrds(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, []);

  return (
    <div>
      {error.message.length !== 0 && (
        <Alert
          message={error.message}
          description={error.description}
          type="error"
          closable
          afterClose={() => {
            setError({
              message: "",
              description: "",
            });
          }}
          style={{ marginBottom: "20px" }}
        />
      )}
      <Form.Item
        label="CRD name"
        name={["ref", "crdName"]}
        rules={[{ required: active, message: "CRD name is required" }]}
      >
        <Select placeholder="Select a CRD">
          {crds.map((crd) => (
            <Select.Option key={crd} value={crd}>
              {crd}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  );
};
