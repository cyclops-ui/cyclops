import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Row,
  Select,
  Table,
  Tag,
  Typography,
  Input,
  Space,
  Card,
  Alert,
} from "antd";
import { useNavigate } from "react-router";
import axios from "axios";
import Link from "antd/lib/typography/Link";

import styles from "./styles.module.css";

const { Title } = Typography;

const Modules = () => {
  const history = useNavigate();
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [namespacesState, setNamespacesState] = useState([]);
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    axios
      .get(`/api/modules/list`)
      .then((res) => {
        setAllData(res.data);
        setFilteredData(res.data);
      })
      .catch((error) => {
        if (error?.response?.data) {
          setError({
            message: error.response.data.message || String(error),
            description:
              error.response.data.description ||
              "Check if Cyclops backend is available on: " +
                window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        } else {
          setError({
            message: String(error),
            description:
              "Check if Cyclops backend is available on: " +
              window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        }
      });
  }, []);

  const namespaces: {} | any = [];
  namespacesState.map((namespace: any) => {
    namespaces.push(
      <Select.Option key={namespace.name}>{namespace.name}</Select.Option>,
    );
  });

  const [value, setValue] = useState("");

  const handleClick = () => {
    history("/modules/new");
  };

  const handleClickNew = () => {
    history("/new-app");
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

  const getTemplateVersion = (version: string) => {
    if (version === "") {
      return <span style={{ color: "#A0A0A0" }}>{"<default>"}</span>;
    }

    return version;
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
          <Button onClick={handleClick} block>
            Add module
          </Button>
        </Col>
      </Row>
      <Row gutter={[40, 0]}>
        <Col span={18}>
          <Input
            placeholder={"Search modules"}
            style={{ width: "30%" }}
            onChange={handleSearch}
          ></Input>
        </Col>
      </Row>
      <Divider orientationMargin="0" />
      <Row gutter={[16, 16]}>
        {filteredData.map((module: any, index) => (
          <Col key={index} span={8}>
            <a href={"/modules/" + module.name}>
              <Card
                title={module.name}
                style={{
                  borderLeft: "solid " + getStatusColor(module) + " 5px",
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
                    <Link aria-level={3} href={module.template.repo}>
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
                        getTemplateVersion(module.template.version) +
                        `/` +
                        module.template.path
                      }
                    >
                      {" " + module.template.path}
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col
                    span={6}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    Version:
                  </Col>
                  <Col
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    {getTemplateVersion(module.template.version)}
                  </Col>
                </Row>
                <Row>
                  <Col
                    offset={6}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    {module.template.resolvedVersion}
                  </Col>
                </Row>
              </Card>
            </a>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Modules;
