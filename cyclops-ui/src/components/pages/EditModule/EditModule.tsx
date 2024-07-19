import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  notification,
  Row,
  Select,
  Spin,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  InfoCircleOutlined,
  LockFilled,
  MinusCircleOutlined,
  PlusOutlined,
  UnlockFilled,
} from "@ant-design/icons";

import AceEditor from "react-ace";

import { useParams } from "react-router-dom";

import "ace-builds/src-noconflict/theme-github";

import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-toml";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/snippets/yaml";
import {
  fileExtension,
  findMaps,
  flattenObjectKeys,
} from "../../../utils/form";
import "./custom.css";
import { numberInputValidators } from "../../../utils/validators/number";
import { stringInputValidators } from "../../../utils/validators/string";
import { templateRef } from "../../../utils/templateRef";
import {
  FeedbackError,
  FormValidationErrors,
} from "../../errors/FormValidationErrors";
import { mapResponseError } from "../../../utils/api/errors";
import {
  getTemplate,
  getTemplateInitialValues,
  Template,
} from "../../../utils/api/template";

const { Title } = Typography;
const layout = {
  wrapperCol: { span: 16 },
};

interface module {
  name: string;
  values: any;
  template: templateRef;
}

const EditModule = () => {
  const [module, setModule] = useState<module>({
    name: "",
    values: {},
    template: {
      repo: "",
      path: "",
      version: "",
      resolvedVersion: "",
    },
  });

  const [previousValues, setPreviousValues] = useState();

  const [form] = Form.useForm();
  const [editTemplateForm] = Form.useForm();

  const [initialValuesRaw, setInitialValuesRaw] = useState({});

  const [values, setValues] = useState({});
  const [isChanged, setIsChanged] = useState(false);
  const [isTemplateChanged, setIsTemplateChanged] = useState(false);
  const [config, setConfig] = useState<Template>({
    name: "",
    resolvedVersion: "",
    root: {
      properties: [],
      required: [],
    },
  });

  const [templateRef, setTemplateRef] = useState<templateRef>({
    repo: "",
    path: "",
    version: "",
    resolvedVersion: "",
  });
  const [templateRefLock, setTemplateRefLock] = useState(true);

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [notificationApi, contextHolder] = notification.useNotification();
  const openNotification = (errors: FeedbackError[]) => {
    notificationApi.error({
      message: "Submit failed!",
      description: <FormValidationErrors errors={errors} />,
      placement: "topRight",
      duration: 0,
    });
  };

  const [loadValues, setLoadValues] = useState(false);
  const [loadTemplate, setLoadTemplate] = useState(false);

  const [activeCollapses, setActiveCollapses] = useState(new Map());
  const updateActiveCollapses = (k: string[], v: any) => {
    let kk = new Array(k);
    setActiveCollapses(new Map(activeCollapses.set(kk.join(""), v)));
  };

  const history = useNavigate();

  let { moduleName } = useParams();

  const mapsToArray = useCallback((fields: any[], values: any): any => {
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
  }, []);

  useEffect(() => {
    const fetchModuleData = async () => {
      axios
        .get("/api/modules/" + moduleName)
        .then(async (res) => {
          editTemplateForm.setFieldsValue({
            repo: res.data.template.repo,
            path: res.data.template.path,
            version: res.data.template.version,
          });
          setLoadValues(true);

          setTemplateRef({
            repo: res.data.template.repo,
            path: res.data.template.path,
            version: res.data.template.version,
            resolvedVersion: res.data.template.resolvedVersion,
          });

          let result = await getTemplate(
            res.data.template.repo,
            res.data.template.path,
            res.data.template.resolvedVersion,
          );

          if (result.success) {
            setConfig(result.template);
            let values = mapsToArray(
              result.template.root.properties,
              res.data.values,
            );

            setModule({
              name: res.data.name,
              values: values,
              template: res.data.template,
            });
            form.setFieldsValue(values);
            setValues(values);
            setPreviousValues(res.data.values);
          } else {
            console.log(result);
            setError(result.error);
          }

          setLoadTemplate(true);
        })
        .catch((error) => {
          setError(mapResponseError(error));
          setLoadTemplate(true);
          setLoadValues(true);
        });
    };
    fetchModuleData();
  }, [editTemplateForm, form, moduleName, mapsToArray]);

  useEffect(() => {
    form.validateFields(flattenObjectKeys(values));
  }, [values, form]);

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (JSON.stringify(allValues) === JSON.stringify(values)) {
      setIsChanged(false);
    } else {
      setIsChanged(true);
    }

    setValues(allValues);
  };

  const handleTemplateRefChange = (
    repo: string,
    path: string,
    version: string,
    resolvedVersion: string,
  ) => {
    let newTemplate: templateRef = {
      repo: repo,
      path: path,
      version: version,
      resolvedVersion: resolvedVersion,
    };

    if (JSON.stringify(module.template) === JSON.stringify(newTemplate)) {
      setIsTemplateChanged(false);
    } else {
      setIsTemplateChanged(true);
    }
  };

  async function handleSubmitTemplateEdit(templateEditValues: any) {
    setLoadTemplate(false);

    let currentValues = form.getFieldsValue();

    let templateResult = await getTemplate(
      templateEditValues.repo,
      templateEditValues.path,
      templateEditValues.version,
    );

    if (!templateResult.success) {
      setConfig({
        name: "",
        resolvedVersion: "",
        root: { properties: [], required: [] },
      });
      setLoadTemplate(true);
      setError(templateResult.error);
      return;
    }

    let initialValuesResult = await getTemplateInitialValues(
      templateEditValues.repo,
      templateEditValues.path,
      templateEditValues.version,
    );

    if (!initialValuesResult.success) {
      setConfig({
        name: "",
        resolvedVersion: "",
        root: { properties: [], required: [] },
      });
      setLoadTemplate(true);
      setError(templateResult.error);
      return;
    }

    // both requests successful
    setTemplateRef({
      repo: templateEditValues.repo,
      path: templateEditValues.path,
      version: templateEditValues.version,
      resolvedVersion: templateResult.template.resolvedVersion,
    });
    handleTemplateRefChange(
      templateEditValues.repo,
      templateEditValues.path,
      templateEditValues.version,
      templateResult.template.resolvedVersion,
    );

    setConfig(templateResult.template);

    let mergedValues = findMaps(
      templateResult.template.root.properties,
      currentValues,
      initialValuesResult.initialValues,
    );

    let mergedValuesMapped = mapsToArray(
      templateResult.template.root.properties,
      mergedValues,
    );

    setValues(mergedValuesMapped);

    setInitialValuesRaw(initialValuesResult.initialValues);
    form.setFieldsValue(mergedValuesMapped);

    setLoadTemplate(true);
  }

  const handleSubmit = (values: any) => {
    if (isTemplateChanged) {
      values = findMaps(config.root.properties, values, initialValuesRaw);
    } else {
      values = findMaps(config.root.properties, values, previousValues);
    }

    axios
      .post(`/api/modules/update`, {
        values: values,
        name: module.name,
        template: templateRef,
      })
      .then((res) => {
        window.location.href = "/modules/" + moduleName;
      })
      .catch((error) => {
        setError(mapResponseError(error));
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
          let moduleValues: any = values;

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
              valuePropName={checked}
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
                paddingLeft: "0px",
                paddingRight: "0px",
                marginLeft: "0px",
                marginRight: "0px",
              }}
            >
              <Collapse
                size={"small"}
                bordered={false}
                style={{
                  borderColor: "#d3d3d3",
                }}
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
              <Form.List name={formItemName}>
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

  const formLoading = () => {
    if (loadTemplate === false || loadValues === false) {
      return (
        <Spin tip="Loading" size="large" style={{ alignContent: "center" }} />
      );
    }

    return (
      <div>
        {mapFields(
          config.root.properties,
          [],
          "",
          0,
          0,
          undefined,
          config.root.required,
        )}
        <div style={{ textAlign: "right" }}>
          <Button
            type="primary"
            htmlType="submit"
            name="Save"
            disabled={!isChanged && !isTemplateChanged}
          >
            Save
          </Button>{" "}
          <Button
            htmlType="button"
            onClick={() => history("/modules/" + moduleName)}
          >
            Back
          </Button>
        </div>
      </div>
    );
  };

  const onFinishFailed = (errors: any) => {
    let errorMessages: FeedbackError[] = [];
    errors.errorFields.forEach(function (error: any) {
      errorMessages.push({
        key: error.name.join("."),
        errors: error.errors,
      });
    });

    openNotification(errorMessages);
  };

  const lockButton = () => {
    if (templateRefLock) {
      return (
        <Button
          type="primary"
          icon={<LockFilled />}
          style={{ marginRight: "10px" }}
          onClick={function () {
            setTemplateRefLock(false);
          }}
        />
      );
    }

    return (
      <Button
        type="primary"
        icon={<UnlockFilled />}
        style={{ marginRight: "10px" }}
        onClick={function () {
          setTemplateRefLock(true);
        }}
      />
    );
  };

  const linkToTemplate = (templateRef: templateRef) => {
    if (templateRef.repo.startsWith("https://github.com")) {
      return (
        <a
          href={
            templateRef.repo +
            `/tree/` +
            templateRef.resolvedVersion +
            `/` +
            templateRef.path
          }
          style={{ color: templateRefLock ? "#B8B8B8" : "" }}
          className="linkToTemplate"
        >
          {templateRef.resolvedVersion.substring(0, 7)}
        </a>
      );
    } else return templateRef.resolvedVersion.substring(0, 7);
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
        <Col span={24}>
          <Title level={2}>{moduleName}</Title>
        </Col>
      </Row>
      <Row gutter={[40, 0]}>
        <Col span={24}>
          <Divider orientation="left" orientationMargin="0">
            Template
          </Divider>
          <Row>
            <Form
              form={editTemplateForm}
              layout="inline"
              autoComplete={"off"}
              onFinish={handleSubmitTemplateEdit}
              onFinishFailed={onFinishFailed}
              style={{ width: "100%" }}
            >
              {lockButton()}
              <Form.Item
                name={"repo"}
                style={{ width: "40%", marginRight: "0" }}
              >
                <Input placeholder={"Repository"} disabled={templateRefLock} />
              </Form.Item>
              <div
                style={{
                  width: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                /
              </div>
              <Form.Item
                name={"path"}
                style={{ width: "20%", marginRight: "0" }}
              >
                <Input placeholder={"Path"} disabled={templateRefLock} />
              </Form.Item>
              <div
                style={{
                  width: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                @
              </div>
              <Form.Item
                name={"version"}
                style={{ width: "20%", marginRight: "0" }}
              >
                <Input
                  placeholder={"Version"}
                  addonAfter={linkToTemplate(templateRef)}
                  disabled={templateRefLock}
                />
              </Form.Item>
              <Form.Item style={{ paddingLeft: "10px", width: "5%" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={!loadTemplate}
                  disabled={templateRefLock}
                >
                  Load
                </Button>
              </Form.Item>
            </Form>
          </Row>
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
            onValuesChange={handleValuesChange}
          >
            <Divider orientation="left" orientationMargin="0">
              Edit Module
            </Divider>
            {formLoading()}
          </Form>
        </Col>
      </Row>
    </div>
  );
};
export default EditModule;
