import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Typography,
  Tooltip,
  Modal,
  Spin,
  notification,
} from "antd";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  MinusCircleOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  fileExtension,
  findMaps,
  flattenObjectKeys,
} from "../../../utils/form";
import "./custom.css";
import defaultTemplate from "../../../static/img/default-template-icon.png";

import YAML from "yaml";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/theme-github";

import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-toml";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/snippets/yaml";
import { numberInputValidators } from "../../../utils/validators/number";
import { stringInputValidators } from "../../../utils/validators/string";
import { Option } from "antd/es/mentions";
import {
  FeedbackError,
  FormValidationErrors,
} from "../../errors/FormValidationErrors";
import { mapResponseError } from "../../../utils/api/errors";

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

  const [activeCollapses, setActiveCollapses] = useState(new Map());
  const updateActiveCollapses = (k: string[], v: any) => {
    let kk = new Array(k);
    setActiveCollapses(new Map(activeCollapses.set(kk.join(""), v)));
  };

  var initLoadedFrom: string[];
  initLoadedFrom = [];
  const [newFile, setNewFile] = useState("");
  const [loadedFrom, setLoadedFrom] = useState(initLoadedFrom);
  const [loadedValues, setLoadedValues] = useState("");
  const [loadingValuesFile, setLoadingValuesFile] = useState(false);
  const [loadingValuesModal, setLoadingValuesModal] = useState(false);

  const [templateStore, setTemplateStore] = useState<templateStoreOption[]>([]);

  const history = useNavigate();

  const [notificationApi, contextHolder] = notification.useNotification();
  const openNotification = (errors: FeedbackError[]) => {
    notificationApi.error({
      message: "Submit failed!",
      description: <FormValidationErrors errors={errors} />,
      placement: "topRight",
      duration: 0,
    });
  };

  const [form] = Form.useForm();

  useEffect(() => {
    loadTemplateStore();
  }, []);

  useEffect(() => {
    form.validateFields(flattenObjectKeys(initialValues));
  }, [initialValues, form]);

  const mapsToArray = (fields: any[], values: any): any => {
    let out: any = {};
    fields.forEach((field) => {
      let valuesList: any[] = [];
      switch (field.type) {
        case "string":
          out[field.name] = values[field.name];
          break;
        case "number":
          out[field.name] = values[field.name];
          break;
        case "boolean":
          out[field.name] = values[field.name];
          break;
        case "object":
          if (values[field.name]) {
            out[field.name] = mapsToArray(field.properties, values[field.name]);
          }
          break;
        case "array":
          if (values[field.name] === undefined || values[field.name] === null) {
            out[field.name] = [];
            break;
          }

          valuesList = [];
          if (Array.isArray(values[field.name])) {
            valuesList = values[field.name];
          } else if (typeof values[field.name] === "string") {
            valuesList = [values[field.name]];
          }

          let objectArr: any[] = [];
          valuesList.forEach((valueFromList) => {
            // array items not defined
            if (field.items === null || field.items === undefined) {
              objectArr.push(valueFromList);
              return;
            }

            switch (field.items.type) {
              case "string":
                objectArr.push(valueFromList);
                break;
              case "object":
                objectArr.push(
                  mapsToArray(field.items.properties, valueFromList),
                );
                break;
            }
          });
          out[field.name] = objectArr;
          break;
        case "map":
          let object: any[] = [];

          if (values[field.name] === undefined || values[field.name] === null) {
            out[field.name] = [];
            break;
          }

          Object.keys(values[field.name]).forEach((key) => {
            object.push({
              key: key,
              value: values[field.name][key],
            });
          });

          out[field.name] = object;

          // valuesList.forEach(valueFromList => {
          //     // object.push({})
          //     // object[valueFromList.key] = valueFromList.value
          // })
          // out[field.name] = object
          break;
      }
    });

    return out;
  };

  const handleSubmit = (values: any) => {
    const moduleName = values["cyclops_module_name"];

    values = findMaps(config.root.properties, values, initialValuesRaw);

    axios
      .post(`/api/modules/new`, {
        name: moduleName,
        values: values,
        template: {
          repo: template.repo,
          path: template.path,
          version: template.version,
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

  const loadTemplate = async (repo: string, path: string, commit: string) => {
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

    setActiveCollapses(new Map());
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
        `/api/templates?repo=` + repo + `&path=` + path + `&commit=` + commit,
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
          commit,
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

    setActiveCollapses(new Map());
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
    });

    loadTemplate(ts.ref.repo, ts.ref.path, ts.ref.version);
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

  const getCollapseColor = (fieldName: string) => {
    let kk = new Array(fieldName);
    let key = kk.join("");
    if (activeCollapses.get(key) && activeCollapses.get(key) === true) {
      return "#faca93";
    } else {
      return "#fae8d4";
    }
  };

  const selectInputField = (
    field: any,
    formItemName: string | string[],
    arrayField: any,
    isRequired: boolean,
  ) => {
    let options: { value: string; label: string }[] = [];
    field.enum.forEach((option: any) => {
      options.push({
        value: option,
        label: option,
      });
    });

    return (
      <Form.Item
        {...arrayField}
        name={formItemName}
        rules={[{ required: isRequired }]}
        style={{
          paddingTop: "8px",
          marginBottom: "12px",
        }}
        label={
          <div>
            {field.display_name}
            <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
              {field.description}
            </p>
          </div>
        }
      >
        <Select
          showSearch
          placeholder={field.name}
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={options}
        />
      </Form.Item>
    );
  };

  const fileField = (
    field: any,
    formItemName: string | string[],
    arrayField: any,
    isRequired: boolean,
  ) => {
    return (
      <Form.Item
        {...arrayField}
        name={formItemName}
        style={{
          paddingTop: "8px",
          marginBottom: "12px",
        }}
        label={
          <div>
            {field.display_name}
            <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
              {field.description}
            </p>
          </div>
        }
        rules={stringInputValidators(field, isRequired)}
      >
        <AceEditor
          mode={fileExtension(field.fileExtension)}
          theme="github"
          fontSize={12}
          showPrintMargin={true}
          showGutter={true}
          highlightActiveLine={true}
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
        />
      </Form.Item>
    );
  };

  const arrayInnerField = (
    fieldName: string,
    uniqueFieldName: string[],
    formItemName: any,
    field: any,
    level: number,
    header: React.JSX.Element,
  ) => {
    if (!field.items || field.items.type === "string") {
      return (
        <Form.Item
          wrapperCol={{ span: level === 0 ? 16 : 24 }}
          name={fieldName}
          style={{
            paddingTop: "0px",
            marginBottom: "12px",
          }}
          label={
            <div>
              {field.display_name}
              <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                {field.description}
              </p>
            </div>
          }
        >
          <Form.List name={formItemName}>
            {(arrFields, { add, remove }) => (
              <div
                style={{
                  border: "solid 1px #d3d3d3",
                  borderRadius: "7px",
                  padding: "12px",
                  width: "100%",
                  backgroundColor: "#fafafa",
                }}
              >
                {arrFields.map((arrField, index) => (
                  <Col key={arrField.key}>
                    <Row>
                      <Form.Item
                        style={{
                          paddingBottom: "8px",
                          marginBottom: "0px",
                          width: "80%",
                        }}
                        wrapperCol={{ span: 24 }}
                        {...arrField}
                        initialValue={field.initialValue}
                        name={[arrField.name]}
                      >
                        <Input />
                      </Form.Item>
                      <MinusCircleOutlined
                        style={{ fontSize: "16px", paddingLeft: "10px" }}
                        onClick={() => remove(arrField.name)}
                      />
                    </Row>
                    {arrFields !== null &&
                    arrFields !== undefined &&
                    index + 1 === arrFields.length ? (
                      <Divider
                        style={{ marginTop: "4px", marginBottom: "12px" }}
                      />
                    ) : (
                      <></>
                    )}
                  </Col>
                ))}
                <Form.Item style={{ marginBottom: "0" }}>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add
                  </Button>
                </Form.Item>
              </div>
            )}
          </Form.List>
        </Form.Item>
      );
    }
    if (field.items.type === "object") {
      return (
        <Collapse
          size={"small"}
          bordered={false}
          onChange={function (value: string | string[]) {
            if (value.length === 0) {
              updateActiveCollapses(uniqueFieldName, false);
            } else {
              updateActiveCollapses(uniqueFieldName, true);
            }
          }}
        >
          <Collapse.Panel
            key={fieldName}
            header={header}
            style={{
              borderRadius: "7px",
              backgroundColor: getCollapseColor(uniqueFieldName.toString()),
            }}
            forceRender={true}
          >
            <Form.Item
              wrapperCol={{ span: 16 }}
              style={{
                paddingTop: "8px",
                marginBottom: "0",
              }}
            >
              <Form.List name={formItemName}>
                {(arrFields, { add, remove }) => (
                  <>
                    {arrFields.map((arrField) => (
                      <Col
                        key={arrField.key}
                        style={{ padding: 0, paddingBottom: "12px" }}
                      >
                        <div
                          style={{
                            border: "solid 1.5px #c3c3c3",
                            borderRadius: "7px",
                            padding: "12px",
                            width: "100%",
                            backgroundColor: "#fafafa",
                          }}
                        >
                          {mapFields(
                            field.items.properties,
                            [...uniqueFieldName, String(arrField.name)],
                            "",
                            level + 1,
                            2,
                            arrField,
                            field.items.required,
                          )}
                          <MinusCircleOutlined
                            style={{ fontSize: "16px" }}
                            onClick={() => remove(arrField.name)}
                          />
                        </div>
                      </Col>
                    ))}
                    <Form.Item style={{ marginBottom: "0" }}>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Add
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      );
    }
  };

  function getValueFromNestedObject(obj: any, keys: string[]): any {
    let currentObj = obj;

    for (const key of keys) {
      if (
        typeof currentObj === "object" &&
        currentObj !== null &&
        key in currentObj
      ) {
        currentObj = currentObj[key];
      } else {
        return false;
      }
    }

    return currentObj;
  }

  function mapFields(
    fields: any[],
    parentFieldID: string[],
    parent: string,
    level: number,
    arrayIndexLifetime: number,
    arrayField?: any,
    required?: string[],
  ) {
    const formFields: {} | any = [];

    if (!fields) {
      return <></>;
    }

    fields.forEach((field: any) => {
      let fieldName = field.name;

      let formItemName = arrayField ? [arrayField.name, fieldName] : fieldName;

      let uniqueFieldName: string[] =
        parentFieldID.length === 0
          ? [field.name]
          : [...parentFieldID, field.name];

      let isRequired = false;

      if (required) {
        for (let r of required) {
          if (r === field.name) {
            isRequired = true;
            break;
          }
        }
      }

      if (arrayIndexLifetime > 0) {
        arrayIndexLifetime = arrayIndexLifetime - 1;
      }

      var header;
      switch (field.type) {
        case "string":
          if (field.enum) {
            formFields.push(
              selectInputField(field, formItemName, arrayField, isRequired),
            );
            return;
          }

          if (field.fileExtension && field.fileExtension.length > 0) {
            formFields.push(
              fileField(field, formItemName, arrayField, isRequired),
            );
            return;
          }

          let stringValidationRules = stringInputValidators(field, isRequired);

          formFields.push(
            <Form.Item
              {...arrayField}
              name={formItemName}
              style={{
                paddingTop: "8px",
                marginBottom: "12px",
              }}
              label={
                <div>
                  {field.display_name}
                  <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                    {field.description}
                  </p>
                </div>
              }
              hasFeedback={stringValidationRules.length > 0}
              validateDebounce={1000}
              rules={stringValidationRules}
            >
              <Input />
            </Form.Item>,
          );
          return;
        case "number":
          let numberValidationRules = numberInputValidators(field, isRequired);

          formFields.push(
            <Form.Item
              {...arrayField}
              initialValue={field.initialValue}
              name={formItemName}
              style={{
                paddingTop: "8px",
                marginBottom: "12px",
              }}
              label={
                <div>
                  {field.display_name}
                  <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                    {field.description}
                  </p>
                </div>
              }
              hasFeedback={numberValidationRules.length > 0}
              validateDebounce={1000}
              rules={numberValidationRules}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>,
          );
          return;
        case "boolean":
          let k = [];
          for (const item of parentFieldID) {
            if (item === "") {
              continue;
            }

            k.push(item);
          }
          k.push(fieldName);

          let checked =
            getValueFromNestedObject(initialValues, k) === true
              ? "checked"
              : "unchecked";
          formFields.push(
            <Form.Item
              initialValue={field.initialValue}
              name={fieldName}
              id={fieldName}
              valuePropName={checked}
              style={{
                paddingTop: "8px",
                marginBottom: "12px",
              }}
              label={
                <div>
                  {field.display_name}
                  <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                    {field.description}
                  </p>
                </div>
              }
            >
              <Switch />
            </Form.Item>,
          );
          return;
        case "object":
          header = <Row>{field.display_name}</Row>;

          if (field.description && field.description.length !== 0) {
            header = (
              <Row gutter={[0, 8]}>
                <Col
                  span={15}
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  {field.display_name}
                </Col>
                <Col
                  span={9}
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Tooltip
                    title={field.description}
                    trigger={["hover", "click"]}
                  >
                    <InfoCircleOutlined
                      style={{ right: "0px", fontSize: "20px" }}
                    />
                  </Tooltip>
                </Col>
              </Row>
            );
          }

          formFields.push(
            <Col
              span={level === 0 ? 16 : 24}
              offset={level === 0 ? 2 : 0}
              style={{
                paddingTop: "8px",
                paddingBottom: "8px",
                marginLeft: "0px",
                marginRight: "0px",
                paddingLeft: "0px",
                paddingRight: "0px",
              }}
            >
              <Collapse
                size={"small"}
                bordered={false}
                onChange={function (value: string | string[]) {
                  if (value.length === 0) {
                    updateActiveCollapses(uniqueFieldName, false);
                  } else {
                    updateActiveCollapses(uniqueFieldName, true);
                  }
                }}
              >
                <Collapse.Panel
                  key={fieldName}
                  header={header}
                  style={{
                    borderRadius: "7px",
                    backgroundColor: getCollapseColor(
                      uniqueFieldName.toString(),
                    ),
                  }}
                  forceRender={true}
                >
                  <Form.List name={formItemName}>
                    {(arrFields, { add, remove }) => (
                      <>
                        {mapFields(
                          field.properties,
                          uniqueFieldName,
                          "",
                          level + 1,
                          arrayIndexLifetime,
                          arrayIndexLifetime > 0 ? arrayField : undefined,
                          field.required,
                        )}
                      </>
                    )}
                  </Form.List>
                </Collapse.Panel>
              </Collapse>
            </Col>,
          );
          return;
        case "array":
          header = <Row>{field.name}</Row>;

          if (field.description && field.description.length !== 0) {
            header = (
              <Row gutter={[0, 8]}>
                <Col
                  span={15}
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  {field.name}
                </Col>
                <Col
                  span={9}
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Tooltip
                    title={field.description}
                    trigger={["hover", "click"]}
                  >
                    <InfoCircleOutlined
                      style={{ right: "0px", fontSize: "20px" }}
                    />
                  </Tooltip>
                </Col>
              </Row>
            );
          }

          formFields.push(
            <Col
              span={level === 0 ? 16 : 24}
              offset={level === 0 ? 2 : 0}
              style={{
                paddingTop: "8px",
                paddingBottom: "8px",
                paddingLeft: "0px",
                paddingRight: "0px",
                marginLeft: "0px",
                marginRight: "0px",
              }}
            >
              {arrayInnerField(
                fieldName,
                uniqueFieldName,
                formItemName,
                field,
                level + 1,
                header,
              )}
            </Col>,
          );
          return;
        case "map":
          formFields.push(
            <Form.Item
              wrapperCol={{ span: level === 0 ? 16 : 24 }}
              name={fieldName}
              rules={[{ required: isRequired }]}
              style={{
                paddingTop: "8px",
                marginBottom: "12px",
              }}
              label={
                <div>
                  {field.display_name}
                  <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                    {field.description}
                  </p>
                </div>
              }
            >
              <Form.List name={formItemName} initialValue={[]}>
                {(fields, { add, remove }) => (
                  <div
                    style={{
                      border: "solid 1px #d3d3d3",
                      borderRadius: "7px",
                      padding: "12px",
                      width: "100%",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    {fields.map((arrField, index) => (
                      <Row
                        key={arrField.key}
                        style={{
                          display: "flex",
                          marginBottom: 8,
                          width: "100%",
                        }}
                      >
                        <Col span={10}>
                          <Form.Item
                            {...arrField}
                            name={[arrField.name, "key"]}
                            rules={[{ required: true, message: "Missing key" }]}
                            style={{ margin: 0, flex: 1, marginRight: "8px" }}
                          >
                            <Input style={{ margin: 0, width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item
                            {...arrField}
                            name={[arrField.name, "value"]}
                            rules={[
                              { required: true, message: "Missing value" },
                            ]}
                            style={{ margin: 0, flex: 1, marginRight: "12px" }}
                          >
                            <Input style={{ margin: 0 }} />
                          </Form.Item>
                        </Col>
                        <MinusCircleOutlined
                          onClick={() => remove(arrField.name)}
                        />
                        {fields !== null &&
                        fields !== undefined &&
                        index + 1 === fields.length ? (
                          <Divider
                            style={{ marginTop: "12px", marginBottom: "4px" }}
                          />
                        ) : (
                          ""
                        )}
                      </Row>
                    ))}
                    <Col span={24}>
                      <Form.Item style={{ marginBottom: "0" }}>
                        <Button
                          type="dashed"
                          onClick={() => {
                            add();
                          }}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add
                        </Button>
                      </Form.Item>
                    </Col>
                  </div>
                )}
              </Form.List>
            </Form.Item>,
          );
      }
    });

    return formFields;
  }

  function renderFormFields() {
    if (!loadingTemplate && !loadingTemplateInitialValues) {
      return mapFields(
        config.root.properties,
        [],
        "",
        0,
        0,
        undefined,
        config.root.required,
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
              Module template
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
              Module name
            </Divider>
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
            <Divider orientation="left" orientationMargin="0">
              Define Module
            </Divider>
            {renderFormFields()}
            <div style={{ textAlign: "right" }}>
              <Button
                onClick={function () {
                  setLoadingValuesModal(true);
                }}
                name="Save"
                disabled={loadingTemplate || loadingTemplateInitialValues}
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
                Save
              </Button>{" "}
              <Button
                htmlType="button"
                onClick={() => history("/")}
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
