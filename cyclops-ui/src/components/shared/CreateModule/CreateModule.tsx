import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Typography,
  Modal,
  Spin,
  notification,
  theme,
  ConfigProvider,
  Switch,
} from "antd";
import {
  deepMerge,
  findMaps,
  flattenObjectKeys,
  mapsToArray,
} from "../../../utils/form";
import "./custom.css";
import defaultTemplate from "../../../static/img/default-template-icon.png";

import YAML, { YAMLError } from "yaml";

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
    crdName: string;
    sourceType: string;
  };
}

export interface CreateModuleProps {
  themePalette?: "dark" | "light";
  themeColor?: string;
  getTemplateStore: () => Promise<any[]>;
  getNamespaces: () => Promise<string[]>;
  getTemplate: (
    repo: string,
    path: string,
    version: string,
    crdName: string,
    sourceType: string,
  ) => Promise<any>;
  getTemplateInitialValues: (
    repo: string,
    path: string,
    version: string,
    crdName: string,
    sourceType: string,
  ) => Promise<any>;
  submitModule: (
    moduleName: string,
    moduleNamespace: string,
    templateRef: any,
    values: string,
    gitOpsWrite?: any,
  ) => Promise<any>;
  onSubmitModuleSuccess: (moduleName: string) => void;
  onBackButton: () => void;
}

export const CreateModuleComponent = ({
  themePalette = "light",
  getTemplateStore,
  getNamespaces,
  getTemplate,
  getTemplateInitialValues,
  submitModule,
  onSubmitModuleSuccess,
  onBackButton,
}: CreateModuleProps) => {
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
    crdName: "",
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

  const [loadedValues, setLoadedValues] = useState("");
  const [loadingValuesModal, setLoadingValuesModal] = useState(false);

  const [templateStore, setTemplateStore] = useState<templateStoreOption[]>([]);

  const [namespaces, setNamespaces] = useState<string[]>([]);

  const [gitopsToggle, SetGitopsToggle] = useState(false);

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
    getTemplateStore()
      .then((res) => {
        setTemplateStore(res);
      })
      .catch(function (error) {
        setLoadingTemplate(false);
        setError(mapResponseError(error));
      });

    getNamespaces()
      .then((res) => {
        setNamespaces(res);
      })
      .catch(function (error) {
        setError(mapResponseError(error));
      });
  }, [getTemplateStore, getNamespaces]);

  useEffect(() => {
    form.validateFields(flattenObjectKeys(initialValues));
  }, [initialValues, form]);

  const handleSubmit = (values: any) => {
    const moduleName = values["cyclops_module_name"];
    const moduleNamespace = values["cyclops_module_namespace"];
    const gitOpsWrite = gitopsToggle
      ? {
          repo: values["gitops-repo"],
          path: values["gitops-path"],
          branch: values["gitops-branch"],
        }
      : null;

    values = findMaps(config.root.properties, values, initialValuesRaw);

    submitModule(
      moduleName,
      moduleNamespace,
      {
        repo: template.repo,
        path: template.path,
        version: template.version,
        crdName: template.crdName,
        sourceType: template.sourceType,
      },
      values,
      gitOpsWrite,
    )
      .then(() => {
        onSubmitModuleSuccess(moduleName);
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
    crdName: string,
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

    if (sourceType !== "crd" && repo.trim() === "") {
      setError({
        message: "Invalid repository name",
        description: "Repository name must not be empty",
      });
      setLoadingTemplate(false);
      setLoadingTemplateInitialValues(false);
      return;
    }

    let tmpConfig: any = {};

    await getTemplate(repo, path, commit, crdName, sourceType)
      .then((templatesRes) => {
        setConfig(templatesRes);
        tmpConfig = templatesRes;

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

    getTemplateInitialValues(repo, path, commit, crdName, sourceType)
      .then((res) => {
        let initialValuesMapped = mapsToArray(tmpConfig.root.properties, res);

        setInitialValuesRaw(res);
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
      crdName: ts.ref.crdName,
      repo: ts.ref.repo,
      path: ts.ref.path,
      version: ts.ref.version,
      sourceType: ts.ref.sourceType,
    });

    loadTemplate(
      ts.ref.repo,
      ts.ref.path,
      ts.ref.version,
      ts.ref.crdName,
      ts.ref.sourceType,
    );
  };

  function renderFormFields() {
    if (!loadingTemplate && !loadingTemplateInitialValues) {
      return (
        <TemplateFormFields
          themePalette={themePalette}
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

    let message = "loading template...";
    if (!loadingTemplate && loadingTemplateInitialValues) {
      message = "loading initial values...";
    }

    return (
      <Col style={{ padding: "0px" }} span={16}>
        <Row style={{ display: "flex", alignItems: "center" }}>
          <Spin size={"large"} />
          <div style={{ paddingLeft: "24px", flexGrow: 1 }}>
            <h4 style={{ color: "#888" }}>{message}</h4>
          </div>
        </Row>
      </Col>
    );
  }

  const handleCancel = () => {
    setLoadingValuesModal(false);
  };

  const handleImportValues = () => {
    let yamlValues = null;
    try {
      yamlValues = YAML.parse(loadedValues);
    } catch (err: any) {
      if (err instanceof YAMLError) {
        setError({
          message: err.name,
          description: err.message,
        });
        return;
      }

      setError({
        message: "Failed injecting YAML to values",
        description: "check if YAML is correctly indented",
      });
      return;
    }

    const currentValues = findMaps(
      config.root.properties,
      form.getFieldsValue(),
      null,
    );
    const values = deepMerge(currentValues, yamlValues);

    form.setFieldsValue(mapsToArray(config.root.properties, values));
    setLoadedValues("");
    setLoadingValuesModal(false);
    setError({ message: "", description: "" });
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
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#FF8803",
          },
          ...(themePalette === "dark" && { algorithm: theme.darkAlgorithm }),
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
                      <span style={{ color: "red", paddingRight: "3px" }}>
                        *
                      </span>
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
                    borderColor:
                      themePalette === "light" ? "#c3c3c3" : "#707070",
                    borderWidth: "1.5px",
                    borderStyle: "solid",
                    borderRadius: "7px",
                    padding: "0px",
                    width: "100%",
                    backgroundColor:
                      themePalette === "light" ? "#fafafa" : "#333",
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
                  <div
                    style={{ display: advancedOptionsExpanded ? "" : "none" }}
                  >
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
                      >
                        {namespaces.map((namespace: string) => (
                          <Option key={namespace} value={namespace}>
                            {namespace}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                  <div
                    style={{ display: advancedOptionsExpanded ? "" : "none" }}
                  >
                    <Divider
                      style={{ marginTop: "12px", marginBottom: "12px" }}
                    />
                    <Form.Item
                      name="gitops"
                      id="gitops"
                      label={
                        <div>
                          Push changes to Git?
                          <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                            Instead of deploying to the cluster, Cyclops will
                            push the changes to a git repository.
                          </p>
                        </div>
                      }
                      style={{ padding: "0px 12px 0px 12px" }}
                    >
                      <Switch
                        onChange={(e) => {
                          SetGitopsToggle(e);
                        }}
                      />
                    </Form.Item>
                    <div style={{ display: gitopsToggle ? "" : "none" }}>
                      <Form.Item
                        label="Repository URL"
                        name="gitops-repo"
                        rules={[
                          {
                            required: gitopsToggle,
                            message: "Repo URL is required",
                          },
                        ]}
                        style={{ padding: "0px 12px 0px 12px" }}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label="Path"
                        name="gitops-path"
                        rules={[
                          {
                            required: gitopsToggle,
                            message: "Path is required",
                          },
                        ]}
                        style={{ padding: "0px 12px 0px 12px" }}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label="Branch"
                        name="gitops-branch"
                        rules={[
                          {
                            required: gitopsToggle,
                            message: "Path is required",
                          },
                        ]}
                        style={{ padding: "0px 12px 0px 12px" }}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                  </div>
                  <div
                    className={"expandadvanced"}
                    style={{
                      backgroundColor:
                        themePalette === "light" ? "#eee" : "#595959",
                    }}
                    onClick={toggleExpand}
                  >
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
                  Import values as YAML
                </Button>{" "}
                <Button
                  type="primary"
                  loading={
                    loading || loadingTemplate || loadingTemplateInitialValues
                  }
                  htmlType="submit"
                  name="Save"
                  // disabled={
                  //   loadingTemplate ||
                  //   loadingTemplateInitialValues ||
                  //   !(template.version || template.path || template.repo)
                  // }
                >
                  Deploy
                </Button>{" "}
                <Button
                  htmlType="button"
                  onClick={() => onBackButton()}
                  disabled={loadingTemplate || loadingTemplateInitialValues}
                >
                  Back
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
        <Modal
          title="Import values as YAML"
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
          <div
            style={{
              paddingRight: "16px",
              paddingBottom: "16px",
              color: "#777",
            }}
          >
            You can paste your values in YAML format here, and after submitting
            them, you can see them in the form and edit them further. If you set
            a value in YAML that does not exist in the UI, it will not be
            applied to your Module.
          </div>
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
      </ConfigProvider>
    </div>
  );
};
