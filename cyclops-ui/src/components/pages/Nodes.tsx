import React, { useEffect, useState } from "react";
import { Button, Col, Row, Table, Typography, Alert } from "antd";
import axios from "axios";
import { formatBytes } from "../../utils/common";
import { mapResponseError } from "../../utils/api/errors";

const { Title } = Typography;

const Nodes = () => {
  const [nodes, setNodes] = useState([]);
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    axios
      .get(`/api/nodes`)
      .then((res) => {
        setNodes(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, []);

  // const handleSearch = (event: any) => {
  //     const query = event.target.value;
  //     var updatedList = [...allData];
  //     updatedList = updatedList.filter((module: any) => {
  //         return module.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  //     });
  //     setFilteredData(updatedList);
  // }

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
      <Row gutter={[40, 0]}>
        <Col span={18}>
          <Title level={2}>Nodes: {nodes.length}</Title>
        </Col>
      </Row>
      <Col span={24} style={{ overflowX: "auto" }}>
        <Table dataSource={nodes}>
          <Table.Column title="Name" dataIndex="name" width={"30%"} />
          <Table.Column
            title="CPU"
            dataIndex="available"
            render={(available) => available.cpu + "m"}
          />
          <Table.Column
            title="Memory"
            dataIndex="available"
            render={(available) => formatBytes(available.memory)}
          />
          <Table.Column
            title="Max pod count"
            dataIndex="available"
            render={(available) => available.pod_count}
          />
          <Table.Column
            width="15%"
            render={(node) => (
              <>
                <Button
                  onClick={function () {
                    window.location.href = "/nodes/" + node.name;
                  }}
                  block
                  type={"primary"}
                >
                  Details
                </Button>
              </>
            )}
          />
        </Table>
      </Col>
    </div>
  );
};

export default Nodes;
