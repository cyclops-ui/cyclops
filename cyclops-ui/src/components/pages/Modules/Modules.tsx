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
  theme,
  ConfigProvider,
  notification,
} from "antd";

import axios from "axios";

import Link from "antd/lib/typography/Link";

import "./custom.css";
import { PlusCircleOutlined, FilterOutlined } from "@ant-design/icons";
import { mapResponseError } from "../../../utils/api/errors";
import { useTheme } from "../../theme/ThemeContext";

const { Title, Text } = Typography;

const Modules = () => {
  const { mode } = useTheme();

  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [moduleHealthFilter, setModuleHealthFilter] = useState<string[]>([
    "Healthy",
    "Unhealthy",
    "Progressing",
    "Unknown",
  ]);
  const [moduleNamespaceFilter, setModuleNamespaceFilter] = useState<string[]>(
    [],
  );
  const [searchInputFilter, setsearchInputFilter] = useState("");
  const resourceFilter = ["Healthy", "Unhealthy", "Progressing", "Unknown"];
  const [namespaceFilterData, setNamespaceFilterData] = useState<string[]>([]);

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [checkedModules, setCheckedModules] = useState<Set<string>>(new Set());

  const handleModuleSelect = (moduleName: string, checked: boolean) => {
    setCheckedModules((prev) => {
      const updatedSet = new Set(prev);
      if (checked) {
        updatedSet.add(moduleName);
      } else {
        updatedSet.delete(moduleName);
      }
      return updatedSet;
    });
  };

  const handleSelectAllModules = (checked: boolean) => {
    if (!checked) {
      setCheckedModules(new Set());
      return;
    }

    setCheckedModules(new Set(filteredData.map((module: any) => module.name)));
  };

  useEffect(() => {
    setLoadingModules(true);

    axios
      .get(`/api/namespaces`)
      .then((res) => {
        setNamespaceFilterData(res.data);
        setModuleNamespaceFilter(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });

    function fetchModules() {
      axios
        .get(`/api/modules/list`)
        .then((res) => {
          setAllData(res.data);
          setLoadingModules(false);
        })
        .catch((error) => {
          setError(mapResponseError(error));
          setLoadingModules(false);
        });
    }

    fetchModules();
    const interval = setInterval(() => fetchModules(), 10000);
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
    const newfilteredData = updatedList.filter(
      (module: any) =>
        moduleHealthFilter
          .map((status) => status.toLowerCase())
          .includes(module.status.toLowerCase()) &&
        moduleNamespaceFilter
          .map((targetNamespace) => targetNamespace.toLowerCase())
          .includes(module.targetNamespace.toLowerCase()),
    );
    setFilteredData(newfilteredData);
  }, [moduleNamespaceFilter, moduleHealthFilter, allData, searchInputFilter]);

  const handleClick = () => {
    window.location.href = "/modules/new";
  };

  const handleBatchReconcile = () => {
    axios
      .post(`/api/modules/reconcile`, {
        modules: checkedModules.keys().toArray(),
      })
      .then(() => {
        notification.success({
          message: "Reconciliation triggered",
          description: `Modules have been queued for reconciliation.`,
          duration: 10,
        });
        setCheckedModules(new Set());
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  };

  const handleSelectItem = (selectedItems: any[]) => {
    setModuleHealthFilter(selectedItems);
  };
  const handleNamespaceSelectItem = (selectedItems: any[]) => {
    setModuleNamespaceFilter(selectedItems);
  };

  const resourceFilterPopover = () => {
    return (
      <>
        <Checkbox.Group
          style={{ display: "block", margin: "5px 0px" }}
          onChange={handleSelectItem}
          value={moduleHealthFilter}
        >
          <Text strong>Health</Text>
          <br />
          {resourceFilter.map((item, index) => (
            <Checkbox key={index} value={item}>
              {item}
            </Checkbox>
          ))}
        </Checkbox.Group>
        <Checkbox.Group
          style={{ display: "block", margin: "5px 0px" }}
          onChange={handleNamespaceSelectItem}
          value={moduleNamespaceFilter}
        >
          <Text strong>Namespace</Text>
          <br />
          {namespaceFilterData.map((item, index) => (
            <Checkbox key={index} value={item}>
              {item}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </>
    );
  };
  const handleSearch = (event: any) => {
    const query = event.target.value;
    setsearchInputFilter(query);
  };

  const getStatusColor = (module: any) => {
    if (module.status === "unknown") {
      return "#d3d3d3";
    }

    if (module.status === "healthy") {
      return "#27D507";
    }

    if (module.status === "progressing") {
      return "#ffbf00";
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
          <Col
            key={filteredData.length + 1}
            xs={24}
            sm={12}
            md={8}
            lg={8}
            xl={6}
          >
            <a href={"/modules/new"}>
              <Card className={"addmodulecard"}>
                <Row
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "50px",
                  }}
                >
                  <PlusCircleOutlined
                    style={{ fontSize: "24px", paddingBottom: "8px" }}
                  />
                </Row>
                <Row>
                  <h3 style={{ margin: 0 }}>Add new module</h3>
                </Row>
              </Card>
            </a>
          </Col>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No Modules Found"
          ></Empty>
        </div>
      );
    }

    let moduleCards = filteredData.map((module: any, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={8} xl={6}>
        <a href={"/modules/" + module.name}>
          <Card
            styles={{
              header: {
                borderRadius: "4px 7px 0 0",
                backgroundColor: checkedModules.has(module.name)
                  ? mode === "light"
                    ? "#fcd8ae"
                    : "#5e3301"
                  : "",
              },
            }}
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  {module.iconURL && (
                    <img
                      alt=""
                      style={{ height: "2em", marginRight: "8px" }}
                      src={module.iconURL}
                    />
                  )}
                  {module.name}
                </div>
                <Checkbox
                  checked={checkedModules.has(module.name)}
                  onChange={(e) =>
                    handleModuleSelect(module.name, e.target.checked)
                  }
                />
              </div>
            }
            style={{
              borderLeft: "solid " + getStatusColor(module) + " 5px",
              width: "100%",
              maxWidth: "500px",
            }}
            className={"modulecard"}
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
                  target="_blank"
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

    moduleCards.push(
      <Col key={filteredData.length + 1} xs={24} sm={12} md={8} lg={8} xl={6}>
        <a href={"/modules/new"}>
          <Card className={"addmodulecard"}>
            <Row
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <PlusCircleOutlined
                style={{ fontSize: "24px", paddingBottom: "8px" }}
              />
            </Row>
            <Row>
              <h3>Add new module</h3>
            </Row>
          </Card>
        </a>
      </Col>,
    );

    return moduleCards;
  };

  return (
    <div style={{ backgroundColor: mode === "light" ? "#fff" : "#141414" }}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#FF8803",
          },
          algorithm:
            mode === "light" ? theme.defaultAlgorithm : theme.darkAlgorithm,
        }}
      >
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

        <Row gutter={[20, 0]} align="middle" justify="space-between">
          <Col>
            <Title level={3}>Deployed modules</Title>
          </Col>
          <Col>
            <Row gutter={[10, 0]} align="middle">
              <Col>
                <Checkbox
                  onChange={(e) => handleSelectAllModules(e.target.checked)}
                >
                  Select all modules
                </Checkbox>
              </Col>
              <Col>
                <Button
                  onClick={handleBatchReconcile}
                  disabled={checkedModules.size === 0}
                  style={{ fontWeight: "600" }}
                  block
                >
                  <PlusCircleOutlined /> Reconcile
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={handleClick}
                  style={{ fontWeight: "600", width: "240px" }}
                  block
                >
                  <PlusCircleOutlined /> Add module
                </Button>
              </Col>
            </Row>
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
      </ConfigProvider>
    </div>
  );
};

export default Modules;
