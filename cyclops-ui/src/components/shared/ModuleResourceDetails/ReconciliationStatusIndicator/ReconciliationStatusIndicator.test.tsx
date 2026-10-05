import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../theme/ThemeContext";
import ReconciliationStatusIndicator, {
  ReconciliationStatusIndicatorProps,
} from "./ReconciliationStatusIndicator";

const renderIndicator = (props: ReconciliationStatusIndicatorProps = {}) => {
  render(
    <ThemeProvider>
      <ReconciliationStatusIndicator {...props} />
    </ThemeProvider>,
  );
};

describe("ReconciliationStatusIndicator", () => {
  it.each([
    ["succeeded", "Succeeded"],
    ["failed", "Failed"],
    ["unknown", "Unknown"],
    ["unexpected", "Unknown"],
  ])("renders the tag for status %s", (status, label) => {
    renderIndicator({ status });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows a transient Reconciling tag that overrides the API state", () => {
    renderIndicator({ status: "succeeded", reconciling: true });

    expect(screen.getByText("Reconciling")).toBeInTheDocument();
    expect(screen.queryByText("Succeeded")).not.toBeInTheDocument();
  });

  it("does not offer an error popover when there are no errors", () => {
    renderIndicator({ status: "failed", errors: [] });

    expect(
      screen.queryByRole("button", { name: "Reconciliation errors" }),
    ).not.toBeInTheDocument();
  });

  it("lists every reconciliation error in the popover", () => {
    renderIndicator({
      status: "succeeded",
      reason: "non critical failures",
      errors: ["first reconciliation error", "second reconciliation error"],
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Reconciliation errors" }),
    );

    expect(screen.getByText("non critical failures")).toBeInTheDocument();
    expect(screen.getByText("first reconciliation error")).toBeInTheDocument();
    expect(screen.getByText("second reconciliation error")).toBeInTheDocument();
  });

  it("falls back to a generic popover title when no reason is reported", () => {
    renderIndicator({ status: "failed", errors: ["something went wrong"] });

    fireEvent.click(
      screen.getByRole("button", { name: "Reconciliation errors" }),
    );

    expect(screen.getByText("Reconciliation errors")).toBeInTheDocument();
    expect(screen.getByText("something went wrong")).toBeInTheDocument();
  });
});
