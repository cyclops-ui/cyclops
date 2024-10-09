import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Typography,
  Modal,
  Spin,
  notification,
} from "antd";
import axios from "axios";
import { findMaps, flattenObjectKeys, mapsToArray } from "../../../utils/form";
import "./custom.css";
import defaultTemplate from "../../../static/img/default-template-icon.png";

import YAML from "yaml";

import AceEditor from "react-ace";

import { Option } from "antd/es/mentions";
import {
  FeedbackError,
  FormValidationErrors,
} from "../../errors/FormValidationErrors";
import { mapResponseError } from "../../../utils/api/errors";
import TemplateFormFields from "../../form/TemplateFormFields";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

const { Title } = Typography;
const layout = {
  wrapperCol: { span: 16 },
};

interface templateStoreOption {
  name: string;
  ref: {
    repo: string;
    path: string;
    version: string;
    sourceType: string;
  };
}

const NewModule = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    name: "",
    version: "",
    manifest: "",
    root: {
      properties: [],
      required: [],
    },
    dependencies: [],
  });

  const [template, setTemplate] = useState({
    repo: "",
    path: "",
    version: "",
    sourceType: "",
  });

  const [initialValues, setInitialValues] = useState({});
  const [initialValuesRaw, setInitialValuesRaw] = useState({});

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingTemplateInitialValues, setLoadingTemplateInitialValues] =
    useState(false);

  var initLoadedFrom: string[];
  initLoadedFrom = [];
  const [newFile, setNewFile] = useState("");
  const [loadedFrom, setLoadedFrom] = useState(initLoadedFrom);
  const [loadedValues, setLoadedValues] = useState("");
  const [loadingValuesFile, setLoadingValuesFile] = useState(false);
  const [loadingValuesModal, setLoadingValuesModal] = useState(false);

  const [templateStore, setTemplateStore] = useState<templateStoreOption[]>([]);

  const [namespaces, setNamespaces] = useState<string[]>([]);

  const [notificationApi, contextHolder] = notification.useNotification();
  const openNotification = (errors: FeedbackError[]) => {
    notificationApi.error({
      message: "Submit failed!",
      description: <FormValidationErrors errors={errors} />,
      placement: "topRight",
      duration: 0,
    });
  };

  const [advancedOptionsExpanded, setAdvancedOptionsExpanded] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    loadTemplateStore();
    loadNamespaces();
  }, []);

  useEffect(() => {
    form.validateFields(flattenObjectKeys(initialValues));
  }, [initialValues, form]);

  const handleSubmit = (values: any) => {
    const moduleName = values["cyclops_module_name"];
    const moduleNamespace = values["cyclops_module_namespace"];

    values = findMaps(config.root.properties, values, initialValuesRaw);

    axios
      .post(`/api/modules/new`, {
        name: moduleName,
        namespace: moduleNamespace,
        values: values,
        template: {
          repo: template.repo,
          path: template.path,
          version: template.version,
          sourceType: template.sourceType,
        },
      })
      .then((res) => {
        window.location.href = "/modules/" + moduleName;
      })
      .catch((error) => {
        setLoading(false);
        setError(mapResponseError(error));
      });
  };

  const loadTemplate = async (
    repo: string,
    path: string,
    commit: string,
    sourceType: string,
  ) => {
    setConfig({
      name: "",
      version: "",
      manifest: "",
      root: {
        properties: [],
        required: [],
      },
      dependencies: [],
    });
    form.setFieldsValue({});
    setInitialValuesRaw({});
    setInitialValues({});

    setLoadingTemplate(true);
    setLoadingTemplateInitialValues(true);

    setError({
      message: "",
      description: "",
    });

    if (repo.trim() === "") {
      setError({
        message: "Invalid repository name",
        description: "Repository name must not be empty",
      });
      setLoadingTemplate(false);
      setLoadingTemplateInitialValues(false);
      return;
    }

    let tmpConfig: any = {};

    await axios
      .get(
        `/api/templates?repo=` +
          repo +
          `&path=` +
          path +
          `&commit=` +
          commit +
          `&sourceType=` +
          sourceType,
      )
      .then((templatesRes) => {
        setConfig(templatesRes.data);
        tmpConfig = templatesRes.data;

        setError({
          message: "",
          description: "",
        });
        setLoadingTemplate(false);
      })
      .catch(function (error) {
        setLoadingTemplate(false);
        setError(mapResponseError(error));
      });

    axios
      .get(
        `/api/templates/initial?repo=` +
          repo +
          `&path=` +
          path +
          `&commit=` +
          commit +
          `&sourceType=` +
          sourceType,
      )
      .then((res) => {
        let initialValuesMapped = mapsToArray(
          tmpConfig.root.properties,
          res.data,
        );

        setInitialValuesRaw(res.data);
        setInitialValues(initialValuesMapped);
        form.setFieldsValue(initialValuesMapped);

        setError({
          message: "",
          description: "",
        });

        setLoadingTemplateInitialValues(false);
      })
      .catch(function (error) {
        setLoadingTemplateInitialValues(false);
        setError(mapResponseError(error));
      });
  };

  const loadTemplateStore = async () => {
    await axios
      .get(`/api/templates/store`)
      .then((res) => {
        setTemplateStore(res.data);
      })
      .catch(function (error) {
        setLoadingTemplate(false);
        setError(mapResponseError(error));
      });
  };

  const loadNamespaces = async () => {
    await axios
      .get(`/api/namespaces`)
      .then((res) => {
        setNamespaces(res.data);
      })
      .catch(function (error) {
        setError(mapResponseError(error));
      });
  };

  const findTemplateStoreSelected = (name: string) => {
    for (let ts of templateStore) {
      if (ts.name === name) {
        return ts;
      }
    }

    return null;
  };

  const onTemplateStoreSelected = (v: string) => {
    const ts = findTemplateStoreSelected(v);
    if (ts === null) {
      return;
    }

    setTemplate({
      repo: ts.ref.repo,
      path: ts.ref.path,
      version: ts.ref.version,
      sourceType: ts.ref.sourceType,
    });

    loadTemplate(ts.ref.repo, ts.ref.path, ts.ref.version, ts.ref.sourceType);
  };

  const onLoadFromFile = () => {
    setLoadingValuesFile(true);
    setLoadedValues("");

    if (newFile.trim() === "") {
      setError({
        message: "Invalid values file",
        description: "Values file can't be empty",
      });
      setLoadingValuesFile(false);
      return;
    }

    setLoadingValuesModal(true);

    loadValues(newFile);
    setLoadingValuesFile(false);
  };

  function renderFormFields() {
    if (!loadingTemplate && !loadingTemplateInitialValues) {
      return (
        <TemplateFormFields
          isModuleEdit={false}
          fields={config.root.properties}
          parentFieldID={[]}
          parent={""}
          level={0}
          arrayIndexLifetime={0}
          initialValues={initialValues}
          required={config.root.required}
        />
      );
    }

    return <Spin size="large" />;
  }

  const handleCancel = () => {
    setLoadingValuesModal(false);
  };

  const handleImportValues = () => {
    form.setFieldsValue(
      mapsToArray(config.root.properties, YAML.parse(loadedValues)),
    );
    setLoadedValues("");
    setLoadingValuesModal(false);
  };

  const renderLoadedFromFiles = () => {
    if (loadedFrom.length === 0) {
      return;
    }

    const files: {} | any = [];

    loadedFrom.forEach((value: string) => {
      files.push(<p>{value}</p>);
    });

    return (
      <Collapse
        ghost
        items={[
          {
            key: "1",
            label: "Imported values from",
            children: files,
          },
        ]}
      />
    );
  };

  const loadValues = (fileName: string) => {
    axios
      .get(fileName)
      .then((res) => {
        setLoadedValues(res.data);
        setError({
          message: "",
          description: "",
        });
        let tmp = loadedFrom;
        tmp.push(newFile);
        setLoadedFrom(tmp);
      })
      .catch(function (error) {
        // setLoadingTemplate(false);
        // setSuccessLoad(false);
        setError(mapResponseError(error));
      });
  };

  const onFinishFailed = (errors: any) => {
    let errorMessages: FeedbackError[] = [];
    errors.errorFields.forEach(function (error: any) {
      let key = error.name.join(".");
      if (error.name.length === 1 && error.name[0] === "cyclops_module_name") {
        key = "Module name";
      }

      errorMessages.push({
        key: key,
        errors: error.errors,
      });
    });

    openNotification(errorMessages);
  };

  const toggleExpand = () => {
    setAdvancedOptionsExpanded(!advancedOptionsExpanded);
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
      {contextHolder}
      <Row gutter={[40, 0]}>
        <Col span={23}>
          <Title style={{ textAlign: "center" }} level={2}>
            Define Module
          </Title>
        </Col>
      </Row>
      <Row gutter={[40, 0]}>
        <Col span={24}>
          <Form
            {...layout}
            form={form}
            layout="vertical"
            autoComplete={"off"}
            onFinish={handleSubmit}
            onFinishFailed={onFinishFailed}
            requiredMark={(label, { required }) => (
              <Row>
                <Col>
                  {required ? (
                    <span style={{ color: "red", paddingRight: "3px" }}>*</span>
                  ) : (
                    <></>
                  )}
                </Col>
                <Col>{label}</Col>
              </Row>
            )}
          >
            <Divider orientation="left" orientationMargin="0">
              Template
            </Divider>
            <Row>
              <Col span={16}>
                <Select
                  showSearch={true}
                  onChange={onTemplateStoreSelected}
                  style={{ width: "100%" }}
                  placeholder="Select an option"
                  disabled={loadingTemplate || loadingTemplateInitialValues}
                >
                  {templateStore.map((option: any, index) => (
                    <Option key={option.name} value={option.name}>
                      {option.iconURL !== null &&
                      option.iconURL !== undefined &&
                      option.iconURL.length !== 0 ? (
                        <img
                          alt=""
                          style={{
                            maxHeight: "1.5em",
                            maxWidth: "1.5em",
                            marginRight: "8px",
                          }}
                          src={option.iconURL}
                        />
                      ) : (
                        <img
                          alt=""
                          style={{
                            maxHeight: "1.5em",
                            maxWidth: "1.5em",
                            marginRight: "8px",
                          }}
                          src={defaultTemplate}
                        />
                      )}
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Divider orientation="left" orientationMargin="0">
              Metadata
            </Divider>
            <Col style={{ padding: "0px" }} span={16}>
              <div
                style={{
                  border: "solid 1.5px #c3c3c3",
                  borderRadius: "7px",
                  padding: "0px",
                  width: "100%",
                  backgroundColor: "#fafafa",
                }}
              >
                <Form.Item
                  name="cyclops_module_name"
                  id="cyclops_module_name"
                  label={
                    <div>
                      Module name
                      <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                        Enter a unique module name
                      </p>
                    </div>
                  }
                  style={{ padding: "12px 12px 0px 12px" }}
                  rules={[
                    {
                      required: true,
                      message: "Module name is required",
                    },
                    {
                      max: 63,
                      message:
                        "Module name must contain no more than 63 characters",
                    },
                    {
                      pattern: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, // only alphanumeric characters and hyphens, cannot start or end with a hyphen and the alpha characters can only be lowercase
                      message:
                        "Module name must follow the Kubernetes naming convention",
                    },
                  ]}
                  hasFeedback={true}
                  validateDebounce={1000}
                >
                  <Input />
                </Form.Item>
                <div style={{ display: advancedOptionsExpanded ? "" : "none" }}>
                  <Divider
                    style={{ marginTop: "12px", marginBottom: "12px" }}
                  />
                  <Form.Item
                    name="cyclops_module_namespace"
                    id="cyclops_module_namespace"
                    label={
                      <div>
                        Target namespace
                        <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                          Namespace used to deploy resources to
                        </p>
                      </div>
                    }
                    style={{ padding: "0px 12px 0px 12px" }}
                    hasFeedback={true}
                    validateDebounce={1000}
                  >
                    <Select
                      showSearch={true}
                      onChange={onTemplateStoreSelected}
                      style={{ width: "100%" }}
                      placeholder="default"
                      value="default"
                      defaultValue="default"
                    >
                      {namespaces.map((namespace: string) => (
                        <Option key={namespace} value={namespace}>
                          {namespace}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
                <div className={"expandadvanced"} onClick={toggleExpand}>
                  {advancedOptionsExpanded ? (
                    <div>
                      Advanced
                      <UpOutlined style={{ paddingLeft: "5px" }} />
                    </div>
                  ) : (
                    <div>
                      Advanced
                      <DownOutlined style={{ paddingLeft: "5px" }} />
                    </div>
                  )}
                </div>
              </div>
            </Col>
            <Divider
              orientation="left"
              orientationMargin="0"
              style={{ borderColor: "#ccc" }}
            >
              Configure
            </Divider>
            {renderFormFields()}
            <div style={{ textAlign: "right" }}>
              <Button
                onClick={function () {
                  setLoadingValuesModal(true);
                }}
                name="Save"
                disabled={
                  loadingTemplate ||
                  loadingTemplateInitialValues ||
                  !config.root.properties
                }
              >
                Load values from file
              </Button>{" "}
              <Button
                type="primary"
                loading={
                  loading || loadingTemplate || loadingTemplateInitialValues
                }
                htmlType="submit"
                name="Save"
                disabled={
                  loadingTemplate ||
                  loadingTemplateInitialValues ||
                  !(template.version || template.path || template.repo)
                }
              >
                Deploy
              </Button>{" "}
              <Button
                htmlType="button"
                onClick={() => (window.location.href = "/")}
                disabled={loadingTemplate || loadingTemplateInitialValues}
              >
                Back
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
      <Modal
        title="Values to import"
        visible={loadingValuesModal}
        onCancel={handleCancel}
        onOk={handleImportValues}
        width={"50%"}
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
        {renderLoadedFromFiles()}
        <Input
          placeholder={"File reference"}
          style={{ width: "90%", marginBottom: "10px" }}
          onChange={(value: any) => {
            setNewFile(value.target.value);
          }}
        />
        {"  "}
        <Button
          type="primary"
          htmlType="button"
          style={{ width: "9%" }}
          onClick={onLoadFromFile}
          loading={loadingValuesFile}
        >
          Load
        </Button>
        <AceEditor
          mode={"yaml"}
          theme="github"
          fontSize={12}
          showPrintMargin={true}
          showGutter={true}
          highlightActiveLine={true}
          onChange={setLoadedValues}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: false,
            showLineNumbers: true,
            tabSize: 4,
            useWorker: false,
          }}
          style={{
            height: "25em",
            width: "100%",
          }}
          value={loadedValues}
        />
      </Modal>
    </div>
  );
};
export default NewModule;
