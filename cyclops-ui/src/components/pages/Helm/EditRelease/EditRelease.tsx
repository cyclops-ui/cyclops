import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Divider,
  Form,
  notification,
  Row,
  Spin,
  Typography,
} from "antd";
import axios from "axios";

import { useParams } from "react-router-dom";

import {
  findMaps,
  flattenObjectKeys,
  mapsToArray,
} from "../../../../utils/form";
import {
  FeedbackError,
  FormValidationErrors,
} from "../../../errors/FormValidationErrors";
import { mapResponseError } from "../../../../utils/api/errors";
import TemplateFormFields from "../../../form/TemplateFormFields";

const { Title } = Typography;
const layout = {
  wrapperCol: { span: 16 },
};

interface Field {
  properties: any[];
  required: any[];
}

const EditRelease = () => {
  let { releaseNamespace, releaseName } = useParams();

  const [form] = Form.useForm();

  const [initialValues, setInitialValues] = useState({});
  const [initialValuesRaw, setInitialValuesRaw] = useState({});

  const [isChanged, setIsChanged] = useState(false);
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
      axios
        .get(`/api/helm/releases/${releaseNamespace}/${releaseName}/fields`)
        .then((fieldsResponse) => {
          setRootField(fieldsResponse.data);

          axios
            .get(`/api/helm/releases/${releaseNamespace}/${releaseName}/values`)
            .then((valuesRes) => {
              setInitialValuesRaw(valuesRes.data);

              let initialValuesMapped = mapsToArray(
                fieldsResponse.data.properties,
                valuesRes.data,
              );

              setInitialValues(initialValuesMapped);

              form.setFieldsValue(initialValuesMapped);
            })
            .catch(function (error) {
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
  }, [releaseNamespace, releaseName, form]);

  useEffect(() => {
    form.validateFields(flattenObjectKeys(initialValues));
  }, [initialValues, form]);

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (JSON.stringify(allValues) === JSON.stringify(initialValues)) {
      setIsChanged(false);
    } else {
      setIsChanged(true);
    }
  };

  const handleSubmit = (values: any) => {
    setLoadingSubmitRequest(true);

    values = findMaps(rootField.properties, values, initialValuesRaw);

    axios
      .post(`/api/helm/releases/${releaseNamespace}/${releaseName}`, values)
      .then((res) => {
        setLoadingSubmitRequest(false);
        window.location.href = `/helm/releases/${releaseNamespace}/${releaseName}`;
      })
      .catch((error) => {
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
            disabled={!isChanged || !loadTemplate || !loadValues}
            loading={loadingSubmitRequest}
          >
            Deploy
          </Button>{" "}
          <Button
            htmlType="button"
            onClick={() =>
              (window.location.href = `/helm/releases/${releaseNamespace}/${releaseName}`)
            }
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
            onValuesChange={handleValuesChange}
          >
            <Divider style={{ marginBottom: "12px", marginTop: "12px" }} />
            {formLoading()}
          </Form>
        </Col>
      </Row>
    </div>
  );
};
export default EditRelease;
