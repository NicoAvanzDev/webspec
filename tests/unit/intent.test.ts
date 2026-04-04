/**
 * Unit tests for agent intent classification.
 */

import { describe, it, expect } from "vitest";
import { classifyIntent, extractBaseUrl } from "../../src/agent/intent";

describe("classifyIntent", () => {
  it("classifies a clear web test request as webspec/high", () => {
    const result = classifyIntent("create a web test that clicks on the docs link");
    expect(result.type).toBe("webspec");
    if (result.type === "webspec") {
      expect(result.confidence).toBe("high");
    }
  });

  it("classifies a navigate + assert request as webspec", () => {
    const result = classifyIntent("navigate to the login page and assert the button is visible");
    expect(result.type).toBe("webspec");
  });

  it("rejects an iOS app request", () => {
    const result = classifyIntent("create a test for my iOS app, tap on the login button");
    expect(result.type).toBe("mobile-rejected");
  });

  it("rejects an Android app request", () => {
    const result = classifyIntent("test my Android app on a device");
    expect(result.type).toBe("mobile-rejected");
  });

  it("rejects a React Native request", () => {
    const result = classifyIntent("automate my React Native app");
    expect(result.type).toBe("mobile-rejected");
  });

  it("returns other for unrelated requests", () => {
    const result = classifyIntent("help me write a Python function");
    expect(result.type).toBe("other");
  });
});

describe("extractBaseUrl", () => {
  it("extracts a URL from the input", () => {
    expect(extractBaseUrl("go to https://example.com and click login")).toBe("https://example.com");
  });

  it("returns undefined when no URL found", () => {
    expect(extractBaseUrl("click on the login button")).toBeUndefined();
  });
});
