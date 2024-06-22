export interface ResponseError {
  message: string;
  description: string;
}

export function mapResponseError(error: any): ResponseError {
  if (error?.response?.data) {
    return {
      message: error.response.data.message || String(error),
      description:
        error.response.data.description ||
        "Check if Cyclops backend is available on: " +
          window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
    };
  }

  return {
    message: String(error),
    description:
      "Check if Cyclops backend is available on: " +
      window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
  };
}
