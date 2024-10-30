import React, { useEffect, useState } from "react";
import {
  Col,
  Divider,
  Row,
  Typography,
  Input,
  Alert,
  Empty,
  Spin,
  Table,
  ConfigProvider,
} from "antd";

import axios from "axios";

import { mapResponseError } from "../../../../utils/api/errors";

import helmLogo from "../../../../static/img/helm.png";

const { Title } = Typography;

const HelmReleases = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [searchInputFilter, setsearchInputFilter] = useState("");
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    setLoadingReleases(true);

    function fetchReleases() {
      axios
        .get(`/api/helm/releases`)
        .then((res) => {
          setAllData(res.data);
          setLoadingReleases(false);
        })
        .catch((error) => {
          setError(mapResponseError(error));
          setLoadingReleases(false);
        });
    }

    fetchReleases();
    const interval = setInterval(() => fetchReleases(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    var updatedList = [...allData];
    updatedList = updatedList.filter((module: any) => {
      return (
        module.name.toLowerCase().indexOf(searchInputFilter.toLowerCase()) !==
        -1
      );
    });
    setFilteredData(updatedList);
  }, [allData, searchInputFilter]);

  const handleSearch = (event: any) => {
    const query = event.target.value;
    setsearchInputFilter(query);
  };

  const renderReleasesCards = () => {
    if (loadingReleases) {
      return <Spin size={"large"} />;
    }

    if (filteredData.length === 0) {
      return (
        <div style={{ width: "100%" }}>
          <Empty description="No Helm releases found"></Empty>
        </div>
      );
    }

    return (
      <ConfigProvider
        theme={{
          components: {
            Table: {
              // rowHoverBg: "#fce7cf",
            },
          },
        }}
      >
        <Table
          dataSource={filteredData}
          onRow={(release: any) => {
            return {
              style: { cursor: "pointer" },
              onClick: () => {
                window.location.href =
                  "/helm/releases/" + release.namespace + "/" + release.name;
              },
            };
          }}
        >
          <Table.Column
            width={"3%"}
            render={() => {
              return (
                <img
                  alt=""
                  style={{ height: "1.5em", marginRight: "8px" }}
                  src={helmLogo}
                />
              );
            }}
          />
          <Table.Column
            width={"25%"}
            title={"Release"}
            render={(release: any) => {
              return (
                <div>
                  {release.name}:{release.revision}
                </div>
              );
            }}
          />
          <Table.Column
            title="Namespace"
            dataIndex={"namespace"}
            width={"20%"}
          />
          <Table.Column title="Chart" dataIndex={"chart"} width={"20%"} />
          <Table.Column title="Version" dataIndex={"version"} width={"10%"} />
        </Table>
      </ConfigProvider>
    );
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

      <Row gutter={[40, 0]}>
        <Col span={18}>
          <Title level={2}>Existing Helm releases</Title>
        </Col>
      </Row>

      <Row>
        <Col span={6}>
          <Input
            placeholder={"Search releases"}
            style={{ width: "100%" }}
            onChange={handleSearch}
          ></Input>
        </Col>
      </Row>
      <Divider orientationMargin="0" />
      <Row gutter={[16, 16]}>
        <Col span={24}>{renderReleasesCards()}</Col>
      </Row>
    </div>
  );
};

export default HelmReleases;
