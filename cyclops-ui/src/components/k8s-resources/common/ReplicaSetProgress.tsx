import { CheckCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Progress, Tooltip } from "antd";

interface ReplicaSetType {
  pods: any[];
  replicas: number;
  activeReplicaSet: string;
}

const ReplicaSetProgress = ({
  pods,
  replicas,
  activeReplicaSet,
}: ReplicaSetType) => {
  // Healthy Replicas (matching replicasets pods) / Total Replicas (defined in the deployment)
  const totalReplicas = replicas;

  const healthyReplicas = pods.filter((elem) => {
    return elem.podPhase === "Running" && elem.replicaSet === activeReplicaSet;
  }).length;

  const healthyReplicasPercent = (healthyReplicas / totalReplicas) * 100;

  return (
    <div
      style={{
        paddingInline: "3rem",
        paddingBottom: "1rem",
      }}
    >
      <Tooltip title={`${healthyReplicas} healthy / ${totalReplicas} total`}>
        <Progress
          percent={100}
          success={{ percent: healthyReplicasPercent }}
          format={() => {
            return healthyReplicasPercent === 100 ? (
              <CheckCircleOutlined />
            ) : (
              <SyncOutlined spin />
            );
          }}
        />
      </Tooltip>
    </div>
  );
};

export default ReplicaSetProgress;
