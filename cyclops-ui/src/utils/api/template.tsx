import axios from "axios";
import { mapResponseError, ResponseError } from "./errors";

export interface Template {
  name: string;
  resolvedVersion: string;
  root: {
    properties: any[];
    required: any[];
  };
}

export interface GetTemplateResult {
  success: boolean;
  error: ResponseError;
  template: Template;
}

export interface GetTemplateInitialResult {
  success: boolean;
  error: ResponseError;
  initialValues: any;
}

export async function getTemplate(
  repo: string,
  path: string,
  version: string,
  sourceType: string,
): Promise<GetTemplateResult> {
  let responseError: ResponseError = {
    message: "",
    description: "",
  };
  let template: Template = {
    name: "",
    resolvedVersion: "",
    root: {
      properties: [],
      required: [],
    },
  };

  await axios
    .get(
      `/api/templates?repo=` +
        repo +
        `&path=` +
        path +
        `&commit=` +
        version +
        `&sourceType=` +
        sourceType,
    )
    .then((templatesRes) => {
      template = templatesRes.data;
    })
    .catch((error) => {
      responseError = mapResponseError(error);
    });

  return {
    success: responseError.message.length === 0,
    error: responseError,
    template: template,
  };
}

export async function getTemplateInitialValues(
  repo: string,
  path: string,
  version: string,
  sourceType: string,
): Promise<GetTemplateInitialResult> {
  let responseError: ResponseError = {
    message: "",
    description: "",
  };
  let initialValues: any = {};

  await axios
    .get(
      `/api/templates/initial?repo=` +
        repo +
        `&path=` +
        path +
        `&commit=` +
        version +
        `&sourceType=` +
        sourceType,
    )
    .then((res) => {
      initialValues = res.data;
    })
    .catch((error) => {
      responseError = mapResponseError(error);
    });

  return {
    success: responseError.message.length === 0,
    error: responseError,
    initialValues: initialValues,
  };
}
