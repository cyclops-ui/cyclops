import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  Input,
  notification,
  Row,
  Spin,
  Typography,
} from "antd";
import axios from "axios";
import { LockFilled, UnlockFilled } from "@ant-design/icons";

import { useParams } from "react-router-dom";

import { findMaps, flattenObjectKeys, mapsToArray } from "../../../utils/form";
import "./custom.css";
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
import TemplateFormFields from "../../form/TemplateFormFields";

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
      sourceType: "",
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
    sourceType: "",
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

  let { moduleName } = useParams();

  const mapsToArrayCallback = useCallback(mapsToArray, []);

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
            sourceType: res.data.template.sourceType,
          });

          let result = await getTemplate(
            res.data.template.repo,
            res.data.template.path,
            res.data.template.resolvedVersion,
            res.data.template.sourceType,
          );

          if (result.success) {
            setConfig(result.template);
            let values = mapsToArrayCallback(
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
  }, [editTemplateForm, form, moduleName, mapsToArrayCallback]);

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
    source: string,
  ) => {
    let newTemplate: templateRef = {
      repo: repo,
      path: path,
      version: version,
      resolvedVersion: resolvedVersion,
      sourceType: templateRef.sourceType,
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
      templateRef.sourceType,
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
      templateRef.sourceType,
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
      sourceType: templateRef.sourceType,
    });
    handleTemplateRefChange(
      templateEditValues.repo,
      templateEditValues.path,
      templateEditValues.version,
      templateResult.template.resolvedVersion,
      templateRef.sourceType,
    );

    setConfig(templateResult.template);

    let mergedValues = findMaps(
      templateResult.template.root.properties,
      currentValues,
      initialValuesResult.initialValues,
    );

    let mergedValuesMapped = mapsToArrayCallback(
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

  const formLoading = () => {
    if (loadTemplate === false || loadValues === false) {
      return (
        <Spin tip="Loading" size="large" style={{ alignContent: "center" }} />
      );
    }

    return (
      <div>
        <TemplateFormFields
          isModuleEdit={true}
          fields={config.root.properties}
          parentFieldID={[]}
          parent={""}
          level={0}
          arrayIndexLifetime={0}
          initialValues={values}
          required={config.root.required}
        />
        <div style={{ textAlign: "right" }}>
          <Button
            type="primary"
            htmlType="submit"
            name="Save"
            disabled={(!isChanged && !isTemplateChanged) || !loadTemplate}
          >
            Deploy
          </Button>{" "}
          <Button
            htmlType="button"
            onClick={() => (window.location.href = "/modules/" + moduleName)}
            disabled={!loadTemplate}
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
          <Title level={2}>
            <span style={{ color: "#888" }}>Edit module</span> {moduleName}
          </Title>
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
              {lockButton()}
              <Form.Item
                name={"repo"}
                style={{ width: "40%", marginRight: "0" }}
              >
                <Input
                  placeholder={"Repository"}
                  disabled={templateRefLock || !loadTemplate}
                />
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
                <Input
                  placeholder={"Path"}
                  disabled={templateRefLock || !loadTemplate}
                />
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
                  disabled={templateRefLock || !loadTemplate}
                />
              </Form.Item>
              <Form.Item style={{ paddingLeft: "10px", width: "5%" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={!loadTemplate}
                  disabled={templateRefLock || !loadTemplate}
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
