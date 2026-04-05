/**
 * Unit tests for env variable resolution.
 */

import { describe, it, expect } from "vitest";
import { resolveEnvString, resolveEnv } from "../../src/application/services/env-resolver";

describe("resolveEnvString", () => {
  it("replaces a known variable", () => {
    expect(resolveEnvString("Hello ${NAME}", { NAME: "World" })).toBe("Hello World");
  });

  it("uses default when variable not set", () => {
    expect(resolveEnvString("${URL:-https://example.com}", {})).toBe("https://example.com");
  });

  it("prefers env over default", () => {
    expect(
      resolveEnvString("${URL:-https://fallback.com}", {
        URL: "https://real.com",
      }),
    ).toBe("https://real.com");
  });

  it("throws when required variable is missing", () => {
    expect(() => resolveEnvString("${REQUIRED_VAR}", {})).toThrow(/REQUIRED_VAR/);
  });

  it("handles multiple placeholders", () => {
    expect(resolveEnvString("${A}+${B}", { A: "foo", B: "bar" })).toBe("foo+bar");
  });

  it("reads from process.env as fallback", () => {
    process.env["TEST_WEBSPEC_VAR"] = "from_process_env";
    expect(resolveEnvString("${TEST_WEBSPEC_VAR}", {})).toBe("from_process_env");
    delete process.env["TEST_WEBSPEC_VAR"];
  });
});

describe("resolveEnv", () => {
  it("resolves strings recursively", () => {
    const input = [{ navigate: { url: "${BASE_URL}/path" } }];
    const result = resolveEnv(input, { BASE_URL: "https://example.com" });
    expect(result).toEqual([{ navigate: { url: "https://example.com/path" } }]);
  });

  it("passes through non-string primitives", () => {
    expect(resolveEnv(42, {})).toBe(42);
    expect(resolveEnv(true, {})).toBe(true);
    expect(resolveEnv(null, {})).toBeNull();
  });

  it("resolves nested object", () => {
    const input = { a: { b: "${X}" } };
    expect(resolveEnv(input, { X: "resolved" })).toEqual({
      a: { b: "resolved" },
    });
  });
});
