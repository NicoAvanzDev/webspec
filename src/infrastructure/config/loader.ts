/**
 * Configuration infrastructure.
 *
 * Loads and resolves webspec.config.yaml with defaults.
 */

import * as path from "node:path";
import type { WebSpecConfig, ResolvedConfig, BrowserType } from "../../domain/index";
import { ConfigError } from "../../domain/index";
import { exists, readFile } from "../persistence/filesystem";
import { parseYamlObject } from "../persistence/yaml";

const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

const DEFAULT_CONFIG: Required<Omit<ResolvedConfig, "configFilePath">> = {
  baseUrl: "",
  browser: "chromium" as BrowserType,
  viewport: DEFAULT_VIEWPORT,
  headless: true,
  timeout: 10000,
  retries: 0,
  specsDir: "tests/specs",
  flowsDir: "tests/flows",
  screenshotsDir: "webspec-artifacts/screenshots",
  artifactsDir: "webspec-artifacts",
  screenshot: "only-on-failure",
  trace: "off",
  reporters: ["console"],
  env: {},
};

/**
 * Load config from file without resolving defaults.
 */
export function loadConfig(cwd: string): WebSpecConfig {
  const configPath = findConfigFile(cwd);

  if (configPath === undefined) {
    return {};
  }

  try {
    const content = readFile(configPath);
    const parsed = parseYamlObject(content, configPath);

    // Basic validation
    if (parsed.reporters !== undefined && !Array.isArray(parsed.reporters)) {
      throw new ConfigError('Config field "reporters" must be an array');
    }

    return parsed as WebSpecConfig;
  } catch (err) {
    if (err instanceof ConfigError) {
      throw err;
    }
    throw new ConfigError(
      `Failed to load config from ${configPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Resolve config with defaults and overrides.
 */
export function resolveConfig(
  cwd: string,
  overrides: Partial<ResolvedConfig> = {},
  specConfig: WebSpecConfig = {},
): ResolvedConfig {
  const fileConfig = loadConfig(cwd);

  const configFilePath = findConfigFile(cwd);

  const resolved: ResolvedConfig = {
    baseUrl:
      overrides.baseUrl ?? specConfig.baseUrl ?? fileConfig.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    browser:
      overrides.browser ?? specConfig.browser ?? fileConfig.browser ?? DEFAULT_CONFIG.browser,
    viewport:
      overrides.viewport ?? specConfig.viewport ?? fileConfig.viewport ?? DEFAULT_CONFIG.viewport,
    headless:
      overrides.headless ?? specConfig.headless ?? fileConfig.headless ?? DEFAULT_CONFIG.headless,
    timeout:
      overrides.timeout ?? specConfig.timeout ?? fileConfig.timeout ?? DEFAULT_CONFIG.timeout,
    retries:
      overrides.retries ?? specConfig.retries ?? fileConfig.retries ?? DEFAULT_CONFIG.retries,
    specsDir: overrides.specsDir ?? fileConfig.specsDir ?? DEFAULT_CONFIG.specsDir,
    flowsDir: overrides.flowsDir ?? fileConfig.flowsDir ?? DEFAULT_CONFIG.flowsDir,
    screenshotsDir:
      overrides.screenshotsDir ?? fileConfig.screenshotsDir ?? DEFAULT_CONFIG.screenshotsDir,
    artifactsDir: overrides.artifactsDir ?? fileConfig.artifactsDir ?? DEFAULT_CONFIG.artifactsDir,
    screenshot: overrides.screenshot ?? fileConfig.screenshot ?? DEFAULT_CONFIG.screenshot,
    trace: overrides.trace ?? fileConfig.trace ?? DEFAULT_CONFIG.trace,
    reporters: overrides.reporters ?? fileConfig.reporters ?? DEFAULT_CONFIG.reporters,
    env: { ...DEFAULT_CONFIG.env, ...fileConfig.env, ...specConfig.env, ...overrides.env },
    ...(configFilePath !== undefined ? { configFilePath } : {}),
  };

  return resolved;
}

const CONFIG_NAMES = [
  "webspec.config.yaml",
  "webspec.config.yml",
  ".webspecrc.yaml",
  ".webspecrc.yml",
];

function findConfigFile(cwd: string): string | undefined {
  for (const name of CONFIG_NAMES) {
    const fullPath = path.join(cwd, name);
    if (exists(fullPath)) {
      return fullPath;
    }
  }
  return undefined;
}
