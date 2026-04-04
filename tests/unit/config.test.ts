/**
 * Unit tests for config loading and merging.
 */

import { describe, it, expect } from "vitest";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { resolveConfig, loadConfig } from "../../src/infrastructure/config/loader";

const CWD = process.cwd();

describe("resolveConfig", () => {
  it("returns sensible defaults", () => {
    const defaults = resolveConfig(CWD);
    expect(defaults.browser).toBe("chromium");
    expect(defaults.headless).toBe(true);
    expect(defaults.timeout).toBe(10000);
    expect(defaults.retries).toBe(0);
    expect(defaults.screenshot).toBe("only-on-failure");
    expect(defaults.trace).toBe("off");
    expect(defaults.reporters).toEqual(["console"]);
    expect(defaults.viewport).toEqual({ width: 1280, height: 720 });
  });

  it("merges partial config with defaults", () => {
    const result = resolveConfig(CWD, { browser: "firefox", timeout: 5000 });
    expect(result.browser).toBe("firefox");
    expect(result.timeout).toBe(5000);
    expect(result.headless).toBe(true); // default
    expect(result.retries).toBe(0); // default
  });

  it("resolves relative specsDir to absolute path", () => {
    const result = resolveConfig(CWD, { specsDir: "my/specs" });
    expect(path.isAbsolute(result.specsDir)).toBe(true);
    expect(result.specsDir).toContain("my");
    expect(result.specsDir).toContain("specs");
  });
});

describe("loadConfig", () => {
  it("returns empty config when no file is found", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webspec-test-"));
    const { config, configFilePath } = loadConfig(tmpDir);
    expect(config).toEqual({});
    expect(configFilePath).toBeUndefined();
    fs.rmdirSync(tmpDir);
  });

  it("loads a valid config file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webspec-test-"));
    const configPath = path.join(tmpDir, "webspec.config.yaml");
    fs.writeFileSync(configPath, "browser: firefox\ntimeout: 5000\n", "utf-8");

    const { config, configFilePath } = loadConfig(tmpDir);
    expect(config.browser).toBe("firefox");
    expect(config.timeout).toBe(5000);
    expect(configFilePath).toBe(configPath);

    fs.unlinkSync(configPath);
    fs.rmdirSync(tmpDir);
  });

  it("throws on invalid config file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webspec-test-"));
    const configPath = path.join(tmpDir, "webspec.config.yaml");
    // Create a config with invalid YAML structure (array instead of object)
    fs.writeFileSync(configPath, "- invalid\n- yaml\n- array\n", "utf-8");

    expect(() => loadConfig(tmpDir)).toThrow();

    fs.unlinkSync(configPath);
    fs.rmdirSync(tmpDir);
  });
});
