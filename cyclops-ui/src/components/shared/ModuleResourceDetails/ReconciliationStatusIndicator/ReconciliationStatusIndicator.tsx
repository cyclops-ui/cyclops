import React from "react";
import { Popover, Tag, Tooltip } from "antd";
import { WarningIcon } from "../../../status/icons";

export interface ModuleReconciliationStatus {
  status?: string;
  reason?: string;
  errors?: string[];
}

export interface ReconciliationStatusIndicatorProps {
  status?: string;
  reason?: string;
  errors?: string[];
  reconciling?: boolean;
}

const ReconciliationStatusIndicator = ({
  status,
  reason,
  errors,
  reconciling,
}: ReconciliationStatusIndicatorProps) => {
  let tagColor = "default";
  let tagText = "Unknown";

  if (reconciling) {
    tagColor = "blue";
    tagText = "Reconciling";
  } else if (status === "succeeded") {
    tagColor = "green";
    tagText = "Succeeded";
  } else if (status === "failed") {
    tagColor = "red";
    tagText = "Failed";
  }

  const reconciliationErrors = errors ?? [];

  return (
    <>
      <Tooltip
        title={
          reason && reason.length !== 0
            ? `Reconciliation status: ${reason}`
            : "Reconciliation status"
        }
      >
        <Tag
          color={tagColor}
          style={{ margin: 0, fontSize: "13px", lineHeight: "20px" }}
        >
          {tagText}
        </Tag>
      </Tooltip>
      {reconciliationErrors.length > 0 && (
        <Popover
          trigger="click"
          title={
            reason && reason.length !== 0 ? reason : "Reconciliation errors"
          }
          content={
            <div style={{ maxWidth: "480px" }}>
              {reconciliationErrors.map((reconciliationError, index) => (
                <div key={index} style={{ marginBottom: "4px" }}>
                  {reconciliationError}
                </div>
              ))}
            </div>
          }
        >
          <button
            type="button"
            aria-label="Reconciliation errors"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <WarningIcon
              style={{ fontSize: "18px", verticalAlign: "middle" }}
            />
          </button>
        </Popover>
      )}
    </>
  );
};

export default ReconciliationStatusIndicator;
