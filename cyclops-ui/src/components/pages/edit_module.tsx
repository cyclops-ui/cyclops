import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  FormListFieldData,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  InfoCircleOutlined,
  LinkOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  WarningFilled,
} from "@ant-design/icons";

import AceEditor from "react-ace";

import { useParams } from "react-router-dom";

import "ace-builds/src-noconflict/theme-github";

import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-toml";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/snippets/yaml";
import { fileExtension, flattenObjectKeys } from "../../utils/form";
import "./custom.css";
import { numberInputValidators } from "../../utils/validators/number";
import { stringInputValidators } from "../../utils/validators/string";

const { TextArea } = Input;

const { Title } = Typography;
const layout = {
  wrapperCol: { span: 16 },
};

const EditModule = () => {
  const [module, setModule] = useState({
    name: "",
    values: {},
    template: {
      repo: "",
      path: "",
      version: "",
    },
  });

  const [form] = Form.useForm();

  const [allConfigs, setAllConfigs] = useState([]);
  const [values, setValues] = useState({});
  const [config, setConfig] = useState({
    name: "",
    manifest: "",
    root: {
      properties: [],
      required: [],
    },
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [loadValues, setLoadValues] = useState(false);
  const [loadTemplate, setLoadTemplate] = useState(false);

  const [activeCollapses, setActiveCollapses] = useState(new Map());
  const updateActiveCollapses = (k: string[] | string, v: any) => {
    let kk = new Array(k);
    setActiveCollapses(new Map(activeCollapses.set(kk.join(""), v)));
  };

  const history = useNavigate();

  let { moduleName } = useParams();

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
          valuesList = values[field.name] as any[];

          let objectArr: any[] = [];
          valuesList.forEach((valueFromList) => {
            switch (field.items.type) {
              case "string":
                objectArr.push(valueFromList);
                break;
              case "object":
                objectArr.push(
                  mapsToArray(field.items.properties, valueFromList)
                );
                break;
            }
          });
          out[field.name] = objectArr;
          break;
        case "map":
          let object: any[] = [];

          if (values[field.name] === undefined || values[field.name] === null) {
            out[field.name] = {};
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

  useEffect(() => {
    axios
      .get(`/api/modules/` + moduleName)
      .then((res) => {
        setLoadValues(true);

        axios
          .get(
            `/api/templates?repo=` +
              res.data.template.repo +
              `&path=` +
              res.data.template.path +
              `&commit=` +
              res.data.template.version
          )
          .then((templatesRes) => {
            setConfig(templatesRes.data);
            setLoadTemplate(true);

            let values = mapsToArray(
              templatesRes.data.root.properties,
              res.data.values
            );

            setModule({
              name: res.data.name,
              values: values,
              template: res.data.template,
            });
            form.setFieldsValue(values);
            setValues(values);
          })
          .catch((error) => {
            setLoadTemplate(true);
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

  useEffect(() => {
    form.validateFields(flattenObjectKeys(values));
  }, [values]);

  const configNames: {} | any = [];
  allConfigs.map((c: any) => {
    configNames.push(<Select.Option key={c.name}>{c.name}</Select.Option>);
  });

  const findMaps = (fields: any[], values: any): any => {
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
            out[field.name] = findMaps(field.properties, values[field.name]);
          }
          break;
        case "array":
          valuesList = values[field.name] as any[];

          if (!valuesList) {
            out[field.name] = [];
            break;
          }

          let objectArr: any[] = [];
          valuesList.forEach((valueFromList) => {
            switch (field.items.type) {
              case "string":
                objectArr.push(valueFromList);
                break;
              case "object":
                objectArr.push(findMaps(field.items.properties, valueFromList));
                break;
            }
          });
          out[field.name] = objectArr;
          break;
        case "map":
          valuesList = values[field.name] as any[];

          if (!valuesList) {
            out[field.name] = {};
            break;
          }

          let object: any = {};
          valuesList.forEach((valueFromList) => {
            object[valueFromList.key] = valueFromList.value;
          });
          out[field.name] = object;
          break;
      }
    });

    return out;
  };

  const handleSubmit = (values: any) => {
    values = findMaps(config.root.properties, values);

    axios
      .post(`/api/modules/update`, {
        values: values,
        name: module.name,
        template: module.template,
      })
      .then((res) => {
        window.location.href = "/modules/" + moduleName;
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
    isRequired: boolean
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
    isRequired: boolean
  ) => {
    return (
      <Form.Item
        {...arrayField}
        name={formItemName}
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
    field: any,
    parentFieldID: string,
    parent: string,
    level: number,
    arrayField: any,
    remove: Function
  ) => {
    switch (field.items.type) {
      case "object":
        return (
          <div>
            {mapFields(
              field.items.properties,
              parentFieldID,
              "",
              level + 1,
              2,
              arrayField,
              field.items.required
            )}
            <MinusCircleOutlined
              style={{ fontSize: "16px" }}
              onClick={() => remove(arrayField.name)}
            />
          </div>
        );
      case "string":
        return (
          <Row>
            <Form.Item
              style={{ paddingBottom: "0px", marginBottom: "0px" }}
              wrapperCol={24}
              {...arrayField}
              initialValue={field.initialValue}
              name={[arrayField.name]}
            >
              <Input />
            </Form.Item>
            <MinusCircleOutlined
              style={{ fontSize: "16px", paddingLeft: "10px" }}
              onClick={() => remove(arrayField.name)}
            />
          </Row>
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
    parentFieldID: string | string[],
    parent: string,
    level: number,
    arrayIndexLifetime: number,
    arrayField?: any,
    required?: string[]
  ) {
    const formFields: {} | any = [];
    fields.forEach((field: any) => {
      let fieldName = field.name;

      let formItemName = arrayField ? [arrayField.name, fieldName] : fieldName;

      let uniqueFieldName: any =
        parentFieldID.length === 0
          ? field.name
          : parentFieldID.concat(".").concat(field.name);

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

      switch (field.type) {
        case "string":
          if (field.enum) {
            formFields.push(
              selectInputField(field, formItemName, arrayField, isRequired)
            );
            return;
          }

          if (field.fileExtension && field.fileExtension.length > 0) {
            formFields.push(
              fileField(field, formItemName, arrayField, isRequired)
            );
            return;
          }

          let stringValidationRules = stringInputValidators(field, isRequired);

          formFields.push(
            <Form.Item
              {...arrayField}
              name={formItemName}
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
            </Form.Item>
          );
          return;
        case "number":
          let numberValidationRules = numberInputValidators(field, isRequired);

          formFields.push(
            <Form.Item
              {...arrayField}
              initialValue={field.initialValue}
              name={formItemName}
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
            </Form.Item>
          );
          return;
        case "boolean":
          let moduleValues: any = module.values;

          let k = [];
          for (const item of parentFieldID) {
            if (item === "") {
              continue;
            }

            k.push(item);
          }
          k.push(fieldName);

          let checked =
            getValueFromNestedObject(moduleValues, k) === true
              ? "checked"
              : "unchecked";
          formFields.push(
            <Form.Item
              initialValue={field.initialValue}
              name={fieldName}
              id={fieldName}
              label={
                <div>
                  {field.display_name}
                  <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
                    {field.description}
                  </p>
                </div>
              }
              valuePropName={checked}
            >
              <Switch />
            </Form.Item>
          );
          return;
        case "object":
          uniqueFieldName =
            parentFieldID.length === 0
              ? field.name
              : parentFieldID.concat(".").concat(field.name);
          var header = <Row>{field.name}</Row>;

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
                paddingBottom: "15px",
                paddingLeft: "0px",
                paddingRight: "0px",
                marginLeft: "0px",
                marginRight: "0px",
              }}
            >
              <Collapse
                size={"small"}
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
                  style={{ backgroundColor: getCollapseColor(uniqueFieldName) }}
                  forceRender={true}
                >
                  <Form.List name={formItemName}>
                    {(arrFields, { add, remove }) => (
                      <>
                        {mapFields(
                          field.properties,
                          [fieldName],
                          "",
                          level + 1,
                          arrayIndexLifetime,
                          arrayIndexLifetime > 0 ? arrayField : undefined,
                          field.required
                        )}
                      </>
                    )}
                  </Form.List>
                </Collapse.Panel>
              </Collapse>
            </Col>
          );
          return;
        case "array":
          uniqueFieldName =
            parentFieldID.length === 0
              ? field.name
              : parentFieldID.concat(".").concat(field.name);
          var header = <Row>{field.name}</Row>;

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
                paddingBottom: "15px",
                marginLeft: "0px",
                marginRight: "0px",
                paddingLeft: "0px",
                paddingRight: "0px",
              }}
            >
              <Collapse
                size={"small"}
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
                  style={{ backgroundColor: getCollapseColor(uniqueFieldName) }}
                  forceRender={true}
                >
                  <Form.List name={formItemName}>
                    {(arrFields, { add, remove }) => (
                      <>
                        {arrFields.map((arrField) => (
                          <Col key={arrField.key}>
                            {arrayInnerField(
                              field,
                              uniqueFieldName.concat(".").concat(arrField.name),
                              "",
                              level + 1,
                              arrField,
                              remove
                            )}
                            <Divider />
                          </Col>
                        ))}

                        <Form.Item>
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
                </Collapse.Panel>
              </Collapse>
            </Col>
          );
          return;
        case "map":
          formFields.push(
            <Form.Item
              name={fieldName}
              rules={[{ required: isRequired }]}
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
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((arrField) => (
                      <Space
                        key={arrField.key}
                        style={{ display: "flex", marginBottom: 8 }}
                        align="baseline"
                      >
                        <Form.Item
                          {...arrField}
                          name={[arrField.name, "key"]}
                          rules={[{ required: true, message: "Missing key" }]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          {...arrField}
                          name={[arrField.name, "value"]}
                          rules={[{ required: true, message: "Missing value" }]}
                        >
                          <Input />
                        </Form.Item>
                        <MinusCircleOutlined
                          onClick={() => remove(arrField.name)}
                        />
                      </Space>
                    ))}
                    <Form.Item>
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
          );
      }
    });

    return formFields;
  }

  const formLoading = () => {
    if (loadTemplate === false || loadValues === false) {
      return (
        <Spin tip="Loading" size="large" style={{ alignContent: "center" }} />
      );
    }
  };

  const onFinishFailed = () => {
    message.error("Submit failed!");
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
        <Col span={23}>
          <Title style={{ textAlign: "center" }} level={2}>
            {module.name}
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
          >
            <Divider orientation="left" orientationMargin="0">
              Edit Module
            </Divider>
            {formLoading()}
            {mapFields(
              config.root.properties,
              "",
              "",
              0,
              0,
              undefined,
              config.root.required
            )}
            <div style={{ textAlign: "right" }}>
              <Button type="primary" htmlType="submit" name="Save">
                Save
              </Button>{" "}
              <Button
                htmlType="button"
                onClick={() => history("/modules/" + moduleName)}
              >
                Back
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
};
export default EditModule;
