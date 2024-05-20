import React from "react";
import { Divider, Row } from "antd";

export interface FeedbackError {
  key: string;
  errors: string[];
}

interface FormValidationErrorsProps {
  errors: FeedbackError[];
}

export const FormValidationErrors: React.FC<FormValidationErrorsProps> = ({
  errors,
}) => {
  let feedbackErrors: React.JSX.Element[] = [];
  errors.forEach((err: FeedbackError) => {
    let errorsForKey: React.JSX.Element[] = [];
    for (let errorForKey of err.errors) {
      errorsForKey.push(<Row>{errorForKey}</Row>);
    }

    feedbackErrors.push(
      <div>
        <Divider style={{ margin: "10px 0px" }} />
        <Row style={{ fontWeight: "bold" }}>{err.key}</Row>
        <Row>{errorsForKey}</Row>
      </div>,
    );
  });

  return <div>{feedbackErrors}</div>;
};
