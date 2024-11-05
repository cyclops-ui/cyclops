import { CheckCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Progress, Tooltip } from "antd";

interface ReplicaSetType {
  replicaSets: any[];
  activeReplicaSet: string;
}

const ReplicaSetProgress = ({
  replicaSets,
  activeReplicaSet,
}: ReplicaSetType) => {
  // Active replicas / Total Replicas
  const totalAvailableReplicas = replicaSets.reduce((acc, rs) => {
    return acc + rs.availableReplicas;
  }, 0);

  const activeAvailableReplicas = replicaSets.filter(
    (rs) => rs.name === activeReplicaSet,
  )[0].availableReplicas;
  const activeAvailableReplicasPercent =
    (activeAvailableReplicas / totalAvailableReplicas) * 100;

  return (
    <div
      style={{
        paddingInline: "3rem",
        paddingBottom: "1rem",
      }}
    >
      <Tooltip
        title={`${activeAvailableReplicas} active / ${totalAvailableReplicas - activeAvailableReplicas} non-active / ${totalAvailableReplicas} total`}
      >
        <Progress
          percent={100}
          success={{ percent: activeAvailableReplicasPercent }}
          format={() => {
            return activeAvailableReplicasPercent === 100 ? (
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
