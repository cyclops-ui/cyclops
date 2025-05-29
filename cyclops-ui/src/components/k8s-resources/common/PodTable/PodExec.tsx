import { CodeOutlined } from "@ant-design/icons";
import { Button, Drawer, Select } from "antd";
import { useEffect, useState } from "react";
import "ace-builds/src-noconflict/ext-searchbox";
import ExecTerminal from "../../../pages/Terminal";
import { Option } from "antd/es/mentions";

interface PodExecProps {
  pod: any;
}

const PodExec = ({ pod }: PodExecProps) => {
  const [openExecModal, setOpenExecModal] = useState(false);
  const [containerName, setContainerName] = useState<string>("");

  useEffect(() => {
    setContainerName(
      pod?.containers?.length > 0 ? pod.containers[0].name : undefined,
    );
  }, [pod]);

  return (
    <>
      <Button
        style={{ width: "100%" }}
        onClick={() => {
          setOpenExecModal(true);
        }}
      >
        <h4 style={{ margin: "0" }}>
          <CodeOutlined style={{ paddingRight: "5px" }} />
          Exec to pod
        </h4>
      </Button>
      <Drawer
        title={
          <div>
            {pod.namespace}/{pod.name}
            <span style={{ fontWeight: "lighter" }}> in container</span>
            <Select
              defaultValue={containerName}
              style={{ marginLeft: "12px" }}
              onChange={(c) => setContainerName(c)}
            >
              {pod.containers.map((item) => (
                <Option key={item.name} value={item.name}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </div>
        }
        placement="bottom"
        onClose={() => {
          setOpenExecModal(false);
        }}
        open={openExecModal}
        height={700}
        styles={{
          body: {
            padding: "0",
          },
        }}
      >
        <ExecTerminal
          namespace={pod.namespace}
          podName={pod.name}
          containerName={containerName}
        />
      </Drawer>
    </>
  );
};

export default PodExec;
