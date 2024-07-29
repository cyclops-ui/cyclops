import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Row,
  Table,
  Typography,
  Alert,
  InputRef,
  Input,
  Space,
} from "antd";
import axios from "axios";
import Highlighter from "react-highlight-words";
import { formatBytes } from "../../utils/common";
import { mapResponseError } from "../../utils/api/errors";
import { FilterConfirmProps } from "antd/es/table/interface";
import { ColumnType } from "antd/lib/table";
import { SearchOutlined } from "@ant-design/icons";

const { Title } = Typography;

const Nodes = () => {
  const [nodes, setNodes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
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

  interface DataSourceType {
    name: string;
  }
  type DataIndex = keyof DataSourceType;

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
          <Table.Column
            title="Name"
            dataIndex="name"
            width={"30%"}
            {...getColumnSearchProps("name")}
          />
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
