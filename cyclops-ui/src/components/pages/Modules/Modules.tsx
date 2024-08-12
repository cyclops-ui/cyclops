import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Row,
  Typography,
  Input,
  Card,
  Alert,
  Empty,
  Spin,
  Popover,
  Checkbox,
} from "antd";
import { useNavigate } from "react-router";
import axios from "axios";
import Link from "antd/lib/typography/Link";

import styles from "./styles.module.css";
import { PlusCircleOutlined, FilterOutlined } from "@ant-design/icons";
import { mapResponseError } from "../../../utils/api/errors";

const { Title } = Typography;

const Modules = () => {
  const history = useNavigate();
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [moduleHealthFilter, setModuleHealthFilter] = useState<string[]>([
    "Healthy",
    "Unhealthy",
    "Unknown",
  ]);
  const resourceFilter = ["Healthy", "Unhealthy", "Unknown"];
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    setLoadingModules(true);
    axios
      .get(`/api/modules/list`)
      .then((res) => {
        setAllData(res.data);
        setFilteredData(res.data);
        setLoadingModules(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoadingModules(false);
      });
  }, []);
  useEffect(() => {
    const newfilteredData = allData.filter((module: any) =>
      moduleHealthFilter
        .map((status) => status.toLowerCase())
        .includes(module.status.toLowerCase()),
    );

    if (JSON.stringify(newfilteredData) !== JSON.stringify(filteredData)) {
      setFilteredData(newfilteredData);
    }
  }, [moduleHealthFilter, filteredData, allData]);

  const handleClick = () => {
    history("/modules/new");
  };
  const handleSelectItem = (selectedItems: any[]) => {
    setModuleHealthFilter(selectedItems);
  };

  const resourceFilterPopover = () => {
    return (
      <Checkbox.Group
        style={{ display: "block" }}
        onChange={handleSelectItem}
        value={moduleHealthFilter}
      >
        {resourceFilter.map((item, index) => (
          <Checkbox key={index} value={item}>
            {item}
          </Checkbox>
        ))}
      </Checkbox.Group>
    );
  };
  const handleSearch = (event: any) => {
    const query = event.target.value;
    var updatedList = [...allData];
    updatedList = updatedList.filter((module: any) => {
      return module.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });
    setFilteredData(updatedList);
  };

  const getStatusColor = (module: any) => {
    if (module.status === "undefined") {
      return "gray";
    }

    if (module.status === "healthy") {
      return "#27D507";
    }

    return "#FF0000";
  };

  const getTemplateVersion = (version: string, resolvedVersion: string) => {
    if (version === "") {
      return (
        <span>
          <span style={{ color: "#A0A0A0" }}>{"<default>"}</span>
          {" - " + resolvedVersion.substring(0, 7)}
        </span>
      );
    }

    return version + " - " + resolvedVersion.substring(0, 7);
  };

  const getLinkPath = (version: string, resolvedVersion: string) => {
    if (resolvedVersion !== "") {
      return resolvedVersion;
    }
    if (version !== "") {
      return version;
    }
    return "main";
  };

  const renderModulesCards = () => {
    if (loadingModules) {
      return <Spin size={"large"} />;
    }
    if (filteredData.length === 0) {
      return (
        <div style={{ width: "100%" }}>
          <Empty description="No Modules Found"></Empty>
        </div>
      );
    }
    return filteredData.map((module: any, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={8} xl={6}>
        <a href={"/modules/" + module.name}>
          <Card
            title={
              <div>
                {module.iconURL ? (
                  <img
                    alt=""
                    style={{ height: "2em", marginRight: "8px" }}
                    src={module.iconURL}
                  />
                ) : (
                  <></>
                )}
                {module.name}
              </div>
            }
            style={{
              borderLeft: "solid " + getStatusColor(module) + " 5px",
              width: "100%",
              maxWidth: "500px",
            }}
            className={styles.modulecard}
          >
            <Row gutter={[16, 16]}>
              <Col
                span={24}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                }}
              >
                Repo:
                <Link
                  aria-level={3}
                  href={module.template.repo}
                  target="_blank"
                >
                  {" " + module.template.repo}
                </Link>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col
                span={24}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                }}
              >
                Path:
                <Link
                  aria-level={3}
                  href={
                    module.template.repo +
                    `/tree/` +
                    getLinkPath(
                      module.template.version,
                      module.template.resolvedVersion,
                    ) +
                    `/` +
                    module.template.path
                  }
                >
                  {" " + module.template.path}
                </Link>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col
                span={24}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                }}
              >
                Version:
                <span style={{ color: "#1677ff" }}>
                  {" "}
                  {getTemplateVersion(
                    module.template.version,
                    module.template.resolvedVersion,
                  )}
                </span>
              </Col>
            </Row>
          </Card>
        </a>
      </Col>
    ));
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
          <Title level={2}>Deployed modules</Title>
        </Col>
        <Col span={6}>
          <Button
            type={"primary"}
            onClick={handleClick}
            block
            style={{
              fontWeight: "600",
            }}
          >
            <PlusCircleOutlined />
            Add module
          </Button>
        </Col>
      </Row>

      <Row>
        <Col span={5}>
          <Input
            placeholder={"Search modules"}
            style={{
              width: "100%",
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "0px",
            }}
            onChange={handleSearch}
            addonAfter={
              <>
                <Popover content={resourceFilterPopover()} trigger="click">
                  <FilterOutlined />
                </Popover>
              </>
            }
          ></Input>
        </Col>
      </Row>
      <Divider orientationMargin="0" />
      <Row gutter={[16, 16]}>{renderModulesCards()}</Row>
    </div>
  );
};

export default Modules;
