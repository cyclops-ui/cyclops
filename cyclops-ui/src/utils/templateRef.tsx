import { Row } from "antd";
import Link from "antd/lib/typography/Link";
import { LinkOutlined } from "@ant-design/icons";
import React from "react";

export interface templateRef {
  repo: string;
  path: string;
  version: string;
  resolvedVersion: string;
  sourceType: string;
}

export function githubTemplateReferenceView(templateRef: templateRef) {
  let refView = templateRef.repo;
  let commitLink =
    templateRef.repo +
    `/tree/` +
    templateRef.resolvedVersion +
    `/` +
    templateRef.path;

  if (templateRef.path && templateRef.path !== "") {
    refView += "/" + templateRef.path;
  }

  if (templateRef.version && templateRef.version !== "") {
    refView += " @ " + templateRef.version;
  }

  if (templateRef.resolvedVersion && templateRef.resolvedVersion !== "") {
    refView += " - " + templateRef.resolvedVersion.substring(0, 7);
  }

  return (
    <Row>
      <Link aria-level={3} href={commitLink}>
        <LinkOutlined />
        {" " + refView}
      </Link>
    </Row>
  );
}

export function defaultTemplateReferenceView(templateRef: templateRef) {
  let refView = templateRef.repo;

  if (templateRef.path && templateRef.path !== "") {
    refView += "/" + templateRef.path;
  }

  if (templateRef.version && templateRef.version !== "") {
    refView += " @ " + templateRef.version;
  }

  if (templateRef.resolvedVersion && templateRef.resolvedVersion !== "") {
    refView += " - " + templateRef.resolvedVersion.substring(0, 7);
  }

  return (
    <Row>
      <span aria-level={3} style={{ color: "#1677ff", height: "22px" }}>
        {refView}
      </span>
    </Row>
  );
}

export function moduleTemplateReferenceView(templateRef: templateRef) {
  if (templateRef.repo.startsWith("https://github.com")) {
    return githubTemplateReferenceView(templateRef);
  }

  return defaultTemplateReferenceView(templateRef);
}
