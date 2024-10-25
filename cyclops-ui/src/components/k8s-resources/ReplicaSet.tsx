import { Table } from "antd";
import { formatReplicaSetAge } from "../../utils/replicaset";

interface ReplicaSetType {
  replicaSets: any[];
}

const ReplicaSet = ({ replicaSets }: ReplicaSetType) => {
  return (
    <div>
      <Table dataSource={replicaSets}>
        <Table.Column
          title="Name"
          dataIndex="name"
          filterSearch={true}
          key="name"
        />
        <Table.Column title="Desired Replicas" dataIndex="replicas" />
        <Table.Column title="Current Replicas" dataIndex="availableReplicas" />
        <Table.Column title="Ready Replicas" dataIndex="readyReplicas" />
        <Table.Column
          title="Started"
          dataIndex="started"
          render={(value) => {
            return <>{formatReplicaSetAge(value)}</>;
          }}
        />
      </Table>
    </div>
  );
};

export default ReplicaSet;
