/**
 * Merge all config sources into a single ResolvedConfig.
 *
 * Precedence (highest → lowest):
 *   1. CLI flags / programmatic overrides
 *   2. process.env variables (WEBSPEC_*)
 *   3. Spec file fields (baseUrl, browser, etc.)
 *   4. Config file (webspec.config.yaml)
 *   5. Built-in defaults
 */

import * as path from 'path';
import { buildDefaults } from './defaults';
import { loadConfig } from './loadConfig';
import type { ResolvedConfig, WebSpecConfig } from '../types/config';
import type { SpecFile } from '../types/spec';

export interface ConfigOverrides {
  baseUrl?: string;
  browser?: ResolvedConfig['browser'];
  headless?: boolean;
  timeout?: number;
  retries?: number;
  screenshot?: ResolvedConfig['screenshot'];
  trace?: ResolvedConfig['trace'];
  reporters?: ResolvedConfig['reporters'];
  env?: Record<string, string>;
  specsDir?: string;
  flowsDir?: string;
  artifactsDir?: string;
  screenshotsDir?: string;
  configFilePath?: string;
}

/**
 * Build a fully resolved config from all sources.
 */
export function resolveConfig(
  cwd: string,
  overrides: ConfigOverrides = {},
  spec?: Pick<SpecFile, 'baseUrl' | 'browser' | 'viewport' | 'headless' | 'timeout' | 'retries' | 'env'>,
): ResolvedConfig {
  const defaults = buildDefaults(cwd);
  const { config: fileConfig, configFilePath } = loadConfig(cwd, overrides.configFilePath);

  // Env from process.env (WEBSPEC_BASE_URL, etc.)
  const envOverrides = readEnvOverrides();

  // Merge env layers: defaults < file < spec < process.env < CLI
  const mergedEnv: Record<string, string> = {
    ...defaults.env,
    ...fileConfig.env,
    ...(spec?.env ?? {}),
    ...envOverrides.env,
    ...overrides.env,
  };

  return {
    baseUrl:
      overrides.baseUrl ??
      envOverrides.baseUrl ??
      spec?.baseUrl ??
      fileConfig.baseUrl ??
      defaults.baseUrl,

    browser:
      overrides.browser ??
      (envOverrides.browser as ResolvedConfig['browser'] | undefined) ??
      spec?.browser ??
      fileConfig.browser ??
      defaults.browser,

    viewport: spec?.viewport ?? fileConfig.viewport ?? defaults.viewport,

    headless:
      overrides.headless ??
      envOverrides.headless ??
      spec?.headless ??
      fileConfig.headless ??
      defaults.headless,

    timeout:
      overrides.timeout ??
      envOverrides.timeout ??
      spec?.timeout ??
      fileConfig.timeout ??
      defaults.timeout,

    retries:
      overrides.retries ??
      spec?.retries ??
      fileConfig.retries ??
      defaults.retries,

    specsDir: overrides.specsDir
      ? path.resolve(cwd, overrides.specsDir)
      : fileConfig.specsDir
        ? path.resolve(path.dirname(configFilePath ?? cwd), fileConfig.specsDir)
        : defaults.specsDir,

    flowsDir: overrides.flowsDir
      ? path.resolve(cwd, overrides.flowsDir)
      : fileConfig.flowsDir
        ? path.resolve(path.dirname(configFilePath ?? cwd), fileConfig.flowsDir)
        : defaults.flowsDir,

    screenshotsDir: overrides.screenshotsDir
      ? path.resolve(cwd, overrides.screenshotsDir)
      : fileConfig.screenshotsDir
        ? path.resolve(path.dirname(configFilePath ?? cwd), fileConfig.screenshotsDir)
        : defaults.screenshotsDir,

    artifactsDir: overrides.artifactsDir
      ? path.resolve(cwd, overrides.artifactsDir)
      : fileConfig.artifactsDir
        ? path.resolve(path.dirname(configFilePath ?? cwd), fileConfig.artifactsDir)
        : defaults.artifactsDir,

    screenshot:
      overrides.screenshot ??
      fileConfig.screenshot ??
      defaults.screenshot,

    trace:
      overrides.trace ??
      fileConfig.trace ??
      defaults.trace,

    reporters:
      overrides.reporters ??
      fileConfig.reporters ??
      defaults.reporters,

    env: mergedEnv,
    ...(configFilePath !== undefined ? { configFilePath } : {}),
  };
}

interface EnvOverridesResult {
  baseUrl?: string;
  browser?: string;
  headless?: boolean;
  timeout?: number;
  env: Record<string, string>;
}

function readEnvOverrides(): EnvOverridesResult {
  const result: EnvOverridesResult = { env: {} };

  if (process.env['WEBSPEC_BASE_URL']) result.baseUrl = process.env['WEBSPEC_BASE_URL'];
  if (process.env['WEBSPEC_BROWSER']) result.browser = process.env['WEBSPEC_BROWSER'];
  if (process.env['WEBSPEC_HEADLESS']) result.headless = process.env['WEBSPEC_HEADLESS'] !== 'false';
  if (process.env['WEBSPEC_TIMEOUT']) {
    const t = parseInt(process.env['WEBSPEC_TIMEOUT'], 10);
    if (!isNaN(t)) result.timeout = t;
  }

  return result;
}

/**
 * Merge a partial config file object with defaults.
 * Used internally by tests.
 */
export function mergeWithDefaults(partial: WebSpecConfig, cwd: string): ResolvedConfig {
  const defaults = buildDefaults(cwd);
  return {
    baseUrl: partial.baseUrl ?? defaults.baseUrl,
    browser: partial.browser ?? defaults.browser,
    viewport: partial.viewport ?? defaults.viewport,
    headless: partial.headless ?? defaults.headless,
    timeout: partial.timeout ?? defaults.timeout,
    retries: partial.retries ?? defaults.retries,
    specsDir: partial.specsDir ? path.resolve(cwd, partial.specsDir) : defaults.specsDir,
    flowsDir: partial.flowsDir ? path.resolve(cwd, partial.flowsDir) : defaults.flowsDir,
    screenshotsDir: partial.screenshotsDir
      ? path.resolve(cwd, partial.screenshotsDir)
      : defaults.screenshotsDir,
    artifactsDir: partial.artifactsDir
      ? path.resolve(cwd, partial.artifactsDir)
      : defaults.artifactsDir,
    screenshot: partial.screenshot ?? defaults.screenshot,
    trace: partial.trace ?? defaults.trace,
    reporters: partial.reporters ?? defaults.reporters,
    env: { ...defaults.env, ...partial.env },
  };
}
