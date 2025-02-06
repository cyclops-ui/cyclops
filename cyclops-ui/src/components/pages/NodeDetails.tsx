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
import {
  CheckCircleTwoTone,
  CloseSquareTwoTone,
  SearchOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { mapResponseError } from "../../utils/api/errors";
import { useTheme } from "../theme/ThemeContext";

const { Title, Text } = Typography;

interface DataSourceType {
  name: string;
  namespace: string;
  cpu: number;
  memory: string;
}

interface NodeCondition {
  type: string;
  status: string;
  lastHeartbeatTime: string;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

type DataIndex = keyof DataSourceType;

const NodeDetails = () => {
  let { nodeName } = useParams();
  const { mode } = useTheme();

  const [node, setNode] = useState({
    name: String,
    pods: [],
    node: {
      metadata: {
        creationTimestamp: new Date().toISOString(),
      },
      status: {
        conditions: [] as NodeCondition[],
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
        .get(`/api/nodes/` + nodeName)
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
      ...getColumnFilterProps("namespace"),
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

  const conditionIcon = (type: string, status: string) => {
    const healthy = (
      <CheckCircleTwoTone
        style={{
          paddingLeft: "6px",
          fontSize: "24px",
          verticalAlign: "middle",
        }}
        twoToneColor={"#52c41a"}
      />
    );

    const unhealthy = (
      <CloseSquareTwoTone
        style={{
          paddingLeft: "6px",
          fontSize: "24px",
          verticalAlign: "middle",
        }}
        twoToneColor={"red"}
      />
    );

    for (let i = 0; i < node.node.status.conditions.length; i++) {
      let cond: any = node.node.status.conditions[i];
      if (cond.type === type) {
        switch (type) {
          case "MemoryPressure":
            return cond.status === "False" ? healthy : unhealthy;
          case "DiskPressure":
            return cond.status === "False" ? healthy : unhealthy;
          case "PIDPressure":
            return cond.status === "False" ? healthy : unhealthy;
          case "Ready":
            return cond.status === "True" ? healthy : unhealthy;
        }
      }
    }
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
        <Text keyboard>
          Created on:{" "}
          {new Date(
            node.node?.metadata?.creationTimestamp.toString(),
          ).toLocaleString()}
        </Text>
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
              percent={Math.round(resources.cpu * 10000) / 100}
              strokeColor={gaugeColors}
            />
            <h1 style={{ marginBottom: "6px" }}>
              <strong>CPU</strong>
            </h1>
            <h3>
              ({node.requested.cpu}m / {node.available.cpu}m)
            </h3>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: "center", width: "80%" }}>
            <Progress
              type="dashboard"
              strokeWidth={10}
              status="normal"
              percent={Math.round(resources.memory * 10000) / 100}
              strokeColor={gaugeColors}
            />
            <h1 style={{ marginBottom: "6px" }}>
              <strong>Memory</strong>
            </h1>
            <h3>
              ({formatBytes(node.requested.memory)}
              {" / "}
              {formatBytes(node.available.memory)})
            </h3>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: "center", width: "80%" }}>
            <Progress
              type="dashboard"
              strokeWidth={10}
              status="normal"
              percent={Math.round(resources.pod_count * 10000) / 100}
              strokeColor={gaugeColors}
            />
            <h1 style={{ marginBottom: "6px" }}>
              <strong>Pods</strong>
            </h1>
            <h3>
              ({node.requested.pod_count} / {node.available.pod_count})
            </h3>
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
        {node.node.status.conditions.map((condition) => (
          <Col
            xs={24}
            sm={12}
            md={8}
            lg={8}
            xl={6}
            key={condition.type}
            span={6}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Card
              style={{
                borderRadius: "10px",
                borderWidth: "3px",
                backgroundColor: mode === "light" ? "#fafafa" : "#333",
                width: "100%",
                margin: "5px",
                color: "black",
              }}
            >
              <h3
                style={{
                  color: mode === "light" ? "#000" : "#fff",
                  paddingBottom: "16px",
                }}
              >
                <strong>
                  {condition.type}
                  {conditionIcon(condition.type, condition.status)}
                </strong>
              </h3>

              <div style={{ marginBottom: "8px" }}>
                <Text strong>Status:</Text>
                <Text> {condition.status}</Text>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <Text strong>Last Transition Time: </Text>
                <br />
                <Text keyboard>
                  {new Date(
                    condition.lastTransitionTime.toString(),
                  ).toLocaleString()}
                </Text>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <Text strong>Last HeartBeat Time: </Text>
                <br />
                <Text keyboard>
                  {new Date(
                    condition.lastHeartbeatTime.toString(),
                  ).toLocaleString()}
                </Text>
              </div>
              <Text strong>Message:</Text>
              <br />
              <Text>{condition.message}</Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Divider
        style={{ fontSize: "120%" }}
        orientationMargin="0"
        orientation={"left"}
      >
        Pods: {node.pods.length}
      </Divider>
      <Col span={24} style={{ overflowX: "auto" }}>
        <Table dataSource={node.pods} columns={columns} />
      </Col>
    </div>
  );
};

export default NodeDetails;
