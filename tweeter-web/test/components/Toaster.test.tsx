// AI-assisted: see AI-ATTRIBUTION.md
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import ToastInfoProvider from "../../src/components/toaster/ToastInfoProvider";
import Toaster from "../../src/components/toaster/Toaster";
import { useMessageActions } from "../../src/components/toaster/MessageHooks";

const Messages = () => {
  const { displayErrorMessage, displayInfoMessage } = useMessageActions();
  return <button onClick={() => {
    displayErrorMessage("Invalid alias or password.");
    displayInfoMessage("Posting status...", 0);
  }}>Show messages</button>;
};

it("automatically dismisses errors, keeps ongoing progress visible, and still allows manual dismissal", () => {
  jest.useFakeTimers();
  try {
    render(<ToastInfoProvider><><Messages /><Toaster position="top-right" /></></ToastInfoProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Show messages" }));
    expect(screen.getByText("Invalid alias or password.")).toBeInTheDocument();
    expect(screen.getByText("Posting status...")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(7000); });
    expect(screen.queryByText("Invalid alias or password.")).not.toBeInTheDocument();
    expect(screen.getByText("Posting status...")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Posting status...")).not.toBeInTheDocument();
  } finally {
    cleanup();
    jest.useRealTimers();
  }
});
