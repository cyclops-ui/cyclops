import { useCallback, useEffect, useState } from "react";
import { mapResponseError } from "../../utils/api/errors";
import { Alert, Descriptions, Divider, Spin } from "antd";
import { useModuleDetailsActions } from "../shared/ModuleResourceDetails/ModuleDetailsActionsContext";

interface Props {
  name: string;
  namespace: string;
}

interface pvc {
  size: string;
  accessModes: string;
}

const PersistentVolumeClaim = ({ name, namespace }: Props) => {
  const { fetchResource } = useModuleDetailsActions();

  const [loading, setLoading] = useState(true);
  const [pvc, setPvc] = useState<pvc>({
    size: "",
    accessModes: "",
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchPersistentVolumeClaim = useCallback(() => {
    fetchResource("", "v1", "PersistentVolumeClaim", name, namespace)()
      .then((res) => {
        setPvc({
          size: res.size,
          accessModes: res.accessmodes.join(","),
        });
        setLoading(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoading(false);
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchPersistentVolumeClaim();
    const interval = setInterval(() => fetchPersistentVolumeClaim(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchPersistentVolumeClaim]);

  if (loading) return <Spin size="large" style={{ marginTop: "20px" }} />;

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
      <Divider />
      <Descriptions style={{ width: "100%" }} bordered>
        {Object.entries(pvc).map(([key, dataValue]) => (
          <Descriptions.Item
            key={key}
            labelStyle={{ width: "20%" }}
            label={key}
            span={24}
          >
            {dataValue}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};

export default PersistentVolumeClaim;
