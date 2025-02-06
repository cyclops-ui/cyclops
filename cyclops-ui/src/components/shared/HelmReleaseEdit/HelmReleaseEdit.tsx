import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  ConfigProvider,
  Divider,
  Form,
  notification,
  Row,
  Spin,
  theme,
} from "antd";
import "ace-builds/src-noconflict/ace";

import "ace-builds/src-noconflict/mode-jsx";

import { mapResponseError } from "../../../utils/api/errors";
import { useParams } from "react-router-dom";
import {
  FeedbackError,
  FormValidationErrors,
} from "../../errors/FormValidationErrors";
import { findMaps, flattenObjectKeys, mapsToArray } from "../../../utils/form";
import TemplateFormFields from "../../form/TemplateFormFields";
import Title from "antd/es/typography/Title";
const layout = {
  wrapperCol: { span: 16 },
};

export interface HelmReleaseEditProps {
  themePalette?: "dark" | "light";
  themeColor?: string;
  fetchHelmReleaseValues: (
    releaseNamespace: string,
    releaseName: string,
  ) => Promise<any>;
  fetchHelmChartFields: (
    releaseNamespace: string,
    releaseNames: string,
  ) => Promise<any>;
  submitHelmReleaseUpdate: (
    releaseNamespace: string,
    releaseName: string,
    values: string,
    templateRef?: any,
  ) => Promise<any>;
  onSubmitSuccess: (releaseNamespace: string, releaseName: string) => void;
  onBackButton: (releaseNamespace: string, releaseName: string) => void;
}

interface Field {
  properties: any[];
  required: any[];
}

export const HelmReleaseEdit = ({
  themePalette,
  themeColor,
  fetchHelmReleaseValues,
  fetchHelmChartFields,
  submitHelmReleaseUpdate,
  onSubmitSuccess,
  onBackButton,
}: HelmReleaseEditProps) => {
  let { releaseNamespace, releaseName } = useParams();

  const [form] = Form.useForm();

  const [initialValues, setInitialValues] = useState({});
  const [initialValuesRaw, setInitialValuesRaw] = useState({});

  const [rootField, setRootField] = useState<Field>({
    properties: [],
    required: [],
  });

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

  const [loadTemplate, setLoadTemplate] = useState(false);
  const [loadValues, setLoadValues] = useState(false);
  const [loadingSubmitRequest, setLoadingSubmitRequest] = useState(false);

  useEffect(() => {
    const fetchReleaseFields = async () => {
      fetchHelmChartFields(releaseNamespace, releaseName)
        .then((fieldsResponse) => {
          setRootField(fieldsResponse.root);

          fetchHelmReleaseValues(releaseNamespace, releaseName)
            .then((valuesResponse) => {
              setInitialValuesRaw(valuesResponse);

              let initialValuesMapped = mapsToArray(
                fieldsResponse.root.properties,
                valuesResponse,
              );

              setInitialValues(initialValuesMapped);

              form.setFieldsValue(initialValuesMapped);
            })
            .catch((error) => {
              setError(mapResponseError(error));
            })
            .finally(() => {
              setLoadValues(true);
            });
        })
        .catch((error) => {
          setLoadValues(true);
          setError(mapResponseError(error));
        })
        .finally(() => {
          setLoadTemplate(true);
        });
    };
    fetchReleaseFields();
  }, [
    releaseNamespace,
    releaseName,
    form,
    fetchHelmChartFields,
    fetchHelmReleaseValues,
  ]);

  useEffect(() => {
    form.validateFields(flattenObjectKeys(initialValues));
  }, [initialValues, form]);

  const handleSubmit = (values: any) => {
    setLoadingSubmitRequest(true);

    values = findMaps(rootField.properties, values, initialValuesRaw);

    submitHelmReleaseUpdate(releaseNamespace, releaseName, values)
      .then(() => {
        setLoadingSubmitRequest(false);
        onSubmitSuccess(releaseNamespace, releaseName);
      })
      .catch(() => {
        setLoadingSubmitRequest(false);
        setError(mapResponseError(error));
      });
  };

  const formLoading = () => {
    if (!loadTemplate || !loadValues) {
      return (
        <Spin tip="Loading" size="large" style={{ alignContent: "center" }} />
      );
    }

    return (
      <div>
        <TemplateFormFields
          isModuleEdit={true}
          fields={rootField.properties}
          parentFieldID={[]}
          parent={""}
          level={0}
          arrayIndexLifetime={0}
          initialValues={initialValues}
          required={rootField.required}
        />
        <div style={{ textAlign: "right" }}>
          <Button
            type="primary"
            htmlType="submit"
            name="Save"
            loading={loadingSubmitRequest}
          >
            Deploy
          </Button>{" "}
          <Button
            htmlType="button"
            onClick={() => onBackButton(releaseNamespace, releaseName)}
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

  return (
    <div>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: themeColor || "#FF8803",
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
          <Col span={24}>
            <Title level={2}>
              <span style={{ color: "#888" }}>Edit release</span>{" "}
              {releaseNamespace}/{releaseName}
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
              <Divider style={{ marginBottom: "12px", marginTop: "12px" }} />
              {formLoading()}
            </Form>
          </Col>
        </Row>
      </ConfigProvider>
    </div>
  );
};
