/**
 * Unit tests for parseSpec.
 */

import { describe, it, expect } from "vitest";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { parseSpec, parseSpecFromString } from "../../src/core/parseSpec";
import { ValidationError } from "../../src/utils/errors";

describe("parseSpecFromString", () => {
  it("parses a valid YAML spec", () => {
    const yaml = `
name: my test
steps:
  - navigate: /path
  - assertVisible: Heading
`;
    const spec = parseSpecFromString(yaml);
    expect(spec.name).toBe("my test");
    expect(spec.steps).toHaveLength(2);
  });

  it("throws ValidationError for invalid spec", () => {
    expect(() => parseSpecFromString("name: test\nsteps: []\n")).toThrow(ValidationError);
  });

  it("throws for invalid YAML", () => {
    expect(() => parseSpecFromString("not: valid: yaml: :")).toThrow();
  });
});

describe("parseSpec", () => {
  it("parses a spec file from disk", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webspec-parse-"));
    const specPath = path.join(tmpDir, "test.spec.yaml");
    fs.writeFileSync(specPath, `name: file test\nsteps:\n  - navigate: /\n`, "utf-8");

    const spec = parseSpec(specPath);
    expect(spec.name).toBe("file test");

    fs.unlinkSync(specPath);
    fs.rmdirSync(tmpDir);
  });

  it("throws for non-existent file", () => {
    expect(() => parseSpec("/nonexistent/path.spec.yaml")).toThrow(/not found/i);
  });
});
