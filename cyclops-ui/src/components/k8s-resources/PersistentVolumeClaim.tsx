import axios from "axios";
import { useEffect, useState } from "react";
import { mapResponseError } from "../../utils/api/errors";
import { Alert, Descriptions, Divider } from "antd";

interface Props {
  name: string;
  namespace: string;
}

interface pvc {
  size: string;
  accessModes: string;
}

const PersistentVolumeClaim = ({ name, namespace }: Props) => {
  const [pvc, setPvc] = useState<pvc>({
    size: "",
    accessModes: "",
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    // Move function to useEffect to avoid es-lint React Hook useEffect has a missing dependency
    // Ref: https://stackoverflow.com/questions/55840294/how-to-fix-missing-dependency-warning-when-using-useeffect-react-hook
    // Ref: https://github.com/facebook/react/issues/14920
    function fetchPersistentVolumeClaim() {
      axios
        .get(`/api/resources`, {
          params: {
            group: ``,
            version: `v1`,
            kind: `PersistentVolumeClaim`,
            name: name,
            namespace: namespace,
          },
        })
        .then((res) => {
          setPvc({
            size: res.data.size,
            accessModes: res.data.accessmodes.join(","),
          });
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchPersistentVolumeClaim();
    const interval = setInterval(() => fetchPersistentVolumeClaim(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [name, namespace]);

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
