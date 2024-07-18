import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Card,
  Col,
  Divider,
  Input,
  Row,
  Space,
  Table,
  Typography,
  Progress,
} from "antd";
import "ace-builds/src-noconflict/ace";
import { useParams } from "react-router-dom";
import axios from "axios";
import "ace-builds/src-noconflict/mode-jsx";
import type { InputRef } from "antd";
import { formatBytes } from "../../utils/common";
import { ColumnType } from "antd/lib/table";
import type { FilterConfirmProps } from "antd/es/table/interface";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { mapResponseError } from "../../utils/api/errors";

const { Title } = Typography;

interface DataSourceType {
  name: string;
  namespace: string;
  cpu: number;
  memory: string;
}

type DataIndex = keyof DataSourceType;

const NodeDetails = () => {
  let { nodeName } = useParams();

  const [node, setNode] = useState({
    name: String,
    pods: [],
    node: {
      status: {
        conditions: [],
      },
    },
    available: {
      cpu: 0,
      memory: 0,
      pod_count: 0,
    },
    requested: {
      cpu: 0,
      memory: 0,
      pod_count: 0,
    },
  });

  const [resources, setResources] = useState({
    cpu: 0,
    memory: 0,
    pod_count: 0,
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (
    clearFilters: () => void,
    confirm: (param?: FilterConfirmProps) => void,
  ) => {
    clearFilters();
    setSearchText("");
    confirm();
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
  ): ColumnType<DataSourceType> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          {/*<Button*/}
          {/*    type="link"*/}
          {/*    size="small"*/}
          {/*    onClick={() => {*/}
          {/*        confirm({ closeDropdown: false });*/}
          {/*        setSearchText((selectedKeys as string[])[0]);*/}
          {/*        setSearchedColumn(dataIndex);*/}
          {/*    }}*/}
          {/*>*/}
          {/*    Filter*/}
          {/*</Button>*/}
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#ff8803" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const getColumnFilterProps = (
    dataIndex: DataIndex,
  ): ColumnType<DataSourceType> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => {
      const uniqueValues = Array.from(
        new Set(node.pods.map((pod: DataSourceType) => pod[dataIndex])),
      );

      return (
        <div
          style={{
            padding: 8,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            {uniqueValues.map((value) => (
              <div
                key={value}
                style={{ display: "flex", alignItems: "center" }}
              >
                <Checkbox
                  checked={selectedKeys.includes(value)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const updatedKeys = checked
                      ? [...selectedKeys, value]
                      : selectedKeys.filter((v: any) => v !== value);
                    setSelectedKeys(updatedKeys);
                  }}
                />
                <span style={{ marginLeft: 8 }}>{value}</span>
              </div>
            ))}
          </div>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
              onClick={() =>
                handleSearch(selectedKeys as string[], confirm, dataIndex)
              }
            >
              Filter
            </Button>
            <Button
              onClick={() => clearFilters && handleReset(clearFilters, confirm)}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                close();
              }}
            >
              Close
            </Button>
          </Space>
        </div>
      );
    },
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#ff8803" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  useEffect(() => {
    const fetchNodeData = () => {
      axios
        .get(
          `https://stunning-space-computing-machine-wxxpjrpr4v5fgqv6-3000.app.github.dev/api/nodes/` +
            nodeName,
        )
        .then((res) => {
          setNode(res.data);
          setResources({
            cpu: +(res.data.requested.cpu / res.data.available.cpu).toFixed(4),
            memory: +(
              res.data.requested.memory / res.data.available.memory
            ).toFixed(4),
            pod_count: +(
              res.data.requested.pod_count / res.data.available.pod_count
            ).toFixed(4),
          });
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    };

    fetchNodeData();

    // setInterval to refresh data every 15 seconds
    const intervalId = setInterval(() => {
      fetchNodeData();
    }, 15000);

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, [nodeName]);

  const columns: ColumnType<DataSourceType>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "30%",
      ...getColumnSearchProps("name"),
    },
    {
      title: "Namespace",
      dataIndex: "namespace",
      key: "namespace",
      width: "30%",
      ...getColumnFilterProps("namespace"), // temp
    },
    {
      title: "CPU",
      dataIndex: "cpu",
      render: (cpu) => cpu + "m",
      sorter: (a: any, b: any) => a.cpu - b.cpu,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Memory",
      dataIndex: "memory",
      render: (memory) => formatBytes(memory),
      sorter: (a: any, b: any) => a.memory - b.memory,
      sortDirections: ["descend", "ascend"],
    },
  ];

  const conditionColor = (type: string): string => {
    for (let i = 0; i < node.node.status.conditions.length; i++) {
      let cond: any = node.node.status.conditions[i];
      if (cond.type === type) {
        switch (type) {
          case "MemoryPressure":
            return cond.status === "True"
              ? gaugeColors["0%"]
              : gaugeColors["100%"];
          case "DiskPressure":
            return cond.status === "True"
              ? gaugeColors["0%"]
              : gaugeColors["100%"];
          case "PIDPressure":
            return cond.status === "True"
              ? gaugeColors["0%"]
              : gaugeColors["100%"];
          case "Ready":
            return cond.status === "True"
              ? gaugeColors["100%"]
              : gaugeColors["0%"];
          default:
            console.log("default", type);
        }
      }
    }

    return gaugeColors["50%"];
  };

  const gaugeColors = {
    "0%": "#57F287",
    "50%": "#FEE75C",
    "100%": "#ED4245",
  };

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
      <Row>
        <Title>{nodeName}</Title>
      </Row>
      <Row>
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Resources requested
        </Divider>
        <Col
          span={8}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              boxSizing: "border-box",
              textAlign: "center",
              width: "80%",
            }}
          >
            <Progress
              type="dashboard"
              strokeWidth={10}
              status="normal"
              percent={resources.cpu * 100}
              strokeColor={gaugeColors}
            />
            <h1>
              <strong>CPU</strong>
              <br />({node.requested.cpu}m / {node.available.cpu}m)
            </h1>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: "center", width: "80%" }}>
            <Progress
              type="dashboard"
              strokeWidth={10}
              status="normal"
              percent={resources.memory * 100}
              strokeColor={gaugeColors}
            />
            <h1>
              <strong>Memory</strong>
              <br />({formatBytes(node.requested.memory)} /{" "}
              {formatBytes(node.available.memory)})
            </h1>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: "center", width: "80%" }}>
            <Progress
              type="dashboard"
              strokeWidth={10}
              status="normal"
              percent={resources.pod_count * 100}
              strokeColor={gaugeColors}
            />
            <h1>
              <strong>Pods</strong>
              <br />({node.requested.pod_count} / {node.available.pod_count})
            </h1>
          </div>
        </Col>
      </Row>
      <Row>
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Conditions
        </Divider>
        <Col
          span={6}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card
            style={{
              borderRadius: "10px",
              borderWidth: "5px",
              backgroundColor: "#fff",
              width: "100%",
              margin: "5px",
              textAlign: "center",
              color: "black",
            }}
          >
            <Progress
              type="circle"
              percent={100}
              status={
                conditionColor("MemoryPressure") === gaugeColors["100%"]
                  ? "success"
                  : "exception"
              }
              trailColor={conditionColor("MemoryPressure")}
              strokeWidth={15}
            />
            <br />
            <br />
            <h3>
              <strong>MemoryPressure</strong>
            </h3>
          </Card>
        </Col>
        <Col
          span={6}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card
            style={{
              borderRadius: "10px",
              borderWidth: "5px",
              backgroundColor: "#fff",
              width: "100%",
              margin: "5px",
              textAlign: "center",
              color: "black",
            }}
          >
            <Progress
              type="circle"
              percent={100}
              status={
                conditionColor("DiskPressure") === gaugeColors["100%"]
                  ? "success"
                  : "exception"
              }
              trailColor={conditionColor("DiskPressure")}
              strokeWidth={15}
            />
            <br />
            <br />
            <h3>
              <strong>DiskPressure</strong>
            </h3>
          </Card>
        </Col>
        <Col
          span={6}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card
            style={{
              borderRadius: "10px",
              borderWidth: "5px",
              backgroundColor: "#fff",
              width: "100%",
              margin: "5px",
              textAlign: "center",
              color: "black",
            }}
          >
            <Progress
              type="circle"
              percent={100}
              status={
                conditionColor("PIDPressure") === gaugeColors["100%"]
                  ? "success"
                  : "exception"
              }
              trailColor={conditionColor("PIDPressure")}
              strokeWidth={15}
            />
            <br />
            <br />
            <h3>
              <strong>PIDPressure</strong>
            </h3>
          </Card>
        </Col>
        <Col
          span={6}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card
            style={{
              borderRadius: "10px",
              borderWidth: "5px",
              backgroundColor: "#fff",
              width: "100%",
              margin: "5px",
              textAlign: "center",
              color: "black",
            }}
          >
            <Progress
              type="circle"
              percent={100}
              status={
                conditionColor("Ready") === gaugeColors["100%"]
                  ? "success"
                  : "exception"
              }
              trailColor={conditionColor("Ready")}
              strokeWidth={15}
            />
            <br />
            <br />
            <h3>
              <strong>Ready</strong>
            </h3>
          </Card>
        </Col>
      </Row>
      <Divider
        style={{ fontSize: "120%" }}
        orientationMargin="0"
        orientation={"left"}
      >
        Pods: {node.pods.length}
      </Divider>
      <Col span={24} style={{ overflowX: "auto" }}>
        <Table dataSource={node.pods} columns={columns}>
          {/*<Table.Column*/}
          {/*    title='Name'*/}
          {/*    dataIndex='name'*/}
          {/*    ...getColumnSearchProps('name', 'Search by Name')*/}
          {/*    width={"30%"}*/}
          {/*/>*/}
          {/*<Table.Column*/}
          {/*    title='Namespace'*/}
          {/*    dataIndex='namespace'*/}
          {/*    width={"30%"}*/}
          {/*/>*/}
          {/*<Table.Column*/}
          {/*    title='CPU'*/}
          {/*    dataIndex='cpu'*/}
          {/*    render={cpu => cpu + 'm'}*/}
          {/*    sorter={(a: any, b: any) => a.cpu - b.cpu}*/}
          {/*    sortDirections={['descend', 'ascend']}*/}
          {/*/>*/}
          {/*<Table.Column*/}
          {/*    title='Memory'*/}
          {/*    dataIndex='memory'*/}
          {/*    render={memory => formatBytes(memory)}*/}
          {/*    sorter={(a: any, b: any) => a.memory - b.memory}*/}
          {/*    sortDirections={['descend', 'ascend']}*/}
          {/*/>*/}
        </Table>
      </Col>
    </div>
  );
};

export default NodeDetails;
