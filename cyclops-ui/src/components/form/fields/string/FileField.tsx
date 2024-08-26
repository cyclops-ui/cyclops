import React from "react";
import { Form } from "antd";
import { stringInputValidators } from "../../../../utils/validators/string";
import AceEditor from "react-ace";
import { fileExtension } from "../../../../utils/form";

import "ace-builds/src-noconflict/theme-github";

import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/mode-toml";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/snippets/yaml";

interface Props {
  field: any;
  formItemName: string | string[];
  arrayField: any;
  isRequired: boolean;
}

export const FileField = ({
  field,
  formItemName,
  arrayField,
  isRequired,
}: Props) => {
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
