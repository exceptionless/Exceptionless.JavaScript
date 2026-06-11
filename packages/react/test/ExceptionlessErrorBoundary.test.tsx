import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ExceptionlessErrorBoundary } from "../src/ExceptionlessErrorBoundary.js";

const mocks = vi.hoisted(() => ({
  createException: vi.fn(),
  setContextProperty: vi.fn(),
  submit: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@exceptionless/browser", () => ({
  Exceptionless: {
    createException: mocks.createException.mockImplementation(() => ({
      setContextProperty: mocks.setContextProperty,
      submit: mocks.submit
    }))
  }
}));

function Crash(): React.ReactNode {
  throw new Error("Boom");
}

describe("ExceptionlessErrorBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    consoleError.mockRestore();
  });

  test("should render fallback content when a child throws", async () => {
    await act(async () => {
      root.render(
        <ExceptionlessErrorBoundary fallback={<p>Something went wrong.</p>}>
          <Crash />
        </ExceptionlessErrorBoundary>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toBe("Something went wrong.");
    expect(mocks.createException).toHaveBeenCalledWith(expect.any(Error));
    expect(mocks.setContextProperty).toHaveBeenCalled();
    expect(mocks.submit).toHaveBeenCalled();
  });

  test("should render nothing by default when a child throws", async () => {
    await act(async () => {
      root.render(
        <ExceptionlessErrorBoundary>
          <Crash />
        </ExceptionlessErrorBoundary>
      );
      await Promise.resolve();
    });

    expect(container.textContent).toBe("");
    expect(mocks.createException).toHaveBeenCalledWith(expect.any(Error));
    expect(mocks.submit).toHaveBeenCalled();
  });
});
