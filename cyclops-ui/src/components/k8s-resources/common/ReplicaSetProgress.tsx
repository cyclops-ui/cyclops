import { Progress, Tooltip } from "antd";

interface ReplicaSetType {
  replicaSets: any[];
}

const ReplicaSetProgress = ({ replicaSets }: ReplicaSetType) => {
  // Active replicas / Total Replicas
  const totalAvailableReplicas = replicaSets.reduce((acc, rs) => {
    return acc + rs.replicas;
  }, 0);

  const activeAvailableReplicas = replicaSets[0]?.replicas || 0;
  const activeAvailableReplicasPercent =
    (activeAvailableReplicas / totalAvailableReplicas) * 100;
  const remainingReplicasPercent = 100 - activeAvailableReplicasPercent;

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
          percent={activeAvailableReplicasPercent + remainingReplicasPercent}
          success={{ percent: activeAvailableReplicasPercent }}
          format={() =>
            `${activeAvailableReplicas} / ${totalAvailableReplicas}`
          }
        />
      </Tooltip>
    </div>
  );
};

export default ReplicaSetProgress;
