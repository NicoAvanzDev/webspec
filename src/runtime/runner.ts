/**
 * WebSpec runtime runner.
 *
 * Orchestrates the full execution lifecycle:
 *   1. Parse + validate spec
 *   2. Resolve env vars
 *   3. Resolve flows (inline runFlow references)
 *   4. Launch Playwright browser + context + page
 *   5. Execute each step with error handling + retries
 *   6. Capture screenshots / traces on failure
 *   7. Return structured results
 */

import * as path from 'path';
import * as fs from 'fs';
import { chromium, firefox, webkit } from 'playwright';
import type { Browser, BrowserContext, Page, BrowserType as PWBrowserType } from 'playwright';
import type { ResolvedConfig } from '../types/config';
import type { SpecFile, Step } from '../types/spec';
import type { SpecResult, StepResult, RunSummary } from '../types/results';
import { parseSpec } from '../core/parseSpec';
import { normaliseSteps } from '../core/normalizeSpec';
import { resolveEnv } from '../core/resolveEnv';
import { resolveFlows } from '../core/flowResolver';
import { resolveConfig } from '../config/resolveConfig';
import { COMMAND_REGISTRY, getCommandKey } from './commands/index';
import { captureScreenshot } from './context';
import { Reporter } from './reporters/index';
import { StepError, WebSpecError } from '../utils/errors';
import { logger } from '../utils/logging';
import type { ExecutionContext } from './context';

export interface RunOptions {
  headed?: boolean;
  browser?: ResolvedConfig['browser'];
  env?: Record<string, string>;
  baseUrl?: string;
  screenshot?: ResolvedConfig['screenshot'];
  trace?: ResolvedConfig['trace'];
  reporters?: ResolvedConfig['reporters'];
  timeout?: number;
  retries?: number;
  /** Filter specs by tag (comma-separated). */
  tags?: string[];
  cwd?: string;
  configFilePath?: string;
}

export interface RunSpecOptions extends RunOptions {
  specPath: string;
}

// ---------------------------------------------------------------------------
// Single spec runner
// ---------------------------------------------------------------------------

export async function runSpec(options: RunSpecOptions): Promise<SpecResult> {
  const cwd = options.cwd ?? process.cwd();
  const specPath = path.resolve(cwd, options.specPath);

  // Parse the spec
  const spec: SpecFile = parseSpec(specPath);

  // Resolve config (spec fields < config file < CLI overrides)
  const config = resolveConfig(cwd, buildOverrides(options), spec);

  const reporter = new Reporter(config);

  const maxAttempts = (config.retries ?? 0) + 1;
  let lastResult: SpecResult | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await runSpecAttempt(spec, specPath, config, reporter, attempt);
    if (lastResult.status === 'passed') break;
    if (attempt < maxAttempts) {
      logger.warn(`Spec "${spec.name}" failed (attempt ${attempt}/${maxAttempts}), retrying…`);
    }
  }

  return lastResult as SpecResult;
}

async function runSpecAttempt(
  spec: SpecFile,
  specPath: string,
  config: ResolvedConfig,
  reporter: Reporter,
  attempt: number,
): Promise<SpecResult> {
  const startTime = Date.now();
  const stepResults: StepResult[] = [];

  reporter.onSpecStart(spec.name, specPath);

  // Setup browser
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;
  let tracePath: string | undefined;

  try {
    browser = await launchBrowser(config);

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      viewport: config.viewport,
      ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
    };
    context = await browser.newContext(contextOptions);

    // Trace
    if (config.trace === 'on' || config.trace === 'retain-on-failure') {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }

    page = await context.newPage();

    // Resolve env (merge config env + spec env)
    const env: Record<string, string> = { ...config.env, ...(spec.env ?? {}) };

    // Normalise + resolve env in steps
    const normalisedSteps = normaliseSteps(spec.steps);
    const envResolved = resolveEnv(normalisedSteps, env) as Step[];

    // Inline runFlow references
    const flatSteps = await resolveFlows(envResolved, {
      parentPath: specPath,
      env,
    });

    const ctx: ExecutionContext = {
      page,
      context,
      config,
      env,
      specPath,
      timeout: config.timeout,
      screenshotCounter: 0,
    };

    // Execute steps
    for (let i = 0; i < flatSteps.length; i++) {
      const step = flatSteps[i] as Step;
      const stepStartTime = Date.now();
      const cmdKey = getCommandKey(step);
      const entry = cmdKey ? COMMAND_REGISTRY[cmdKey] : undefined;
      const description = entry ? entry.describe(step) : `[unknown: ${cmdKey ?? '?'}]`;

      if (!entry) {
        const result: StepResult = {
          index: i,
          command: cmdKey ?? 'unknown',
          description,
          status: 'failed',
          durationMs: 0,
          error: `Unknown command: "${cmdKey}". Check supported commands with \`webspec --help\`.`,
        };
        stepResults.push(result);
        reporter.onStepResult(result);
        break; // Unknown command → stop
      }

      try {
        await entry.execute(step, ctx);
        const result: StepResult = {
          index: i,
          command: cmdKey ?? 'unknown',
          description,
          status: 'passed',
          durationMs: Date.now() - stepStartTime,
        };
        stepResults.push(result);
        reporter.onStepResult(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        // Capture failure screenshot
        let screenshotPath: string | undefined;
        if (config.screenshot !== 'off') {
          screenshotPath = await captureScreenshot(ctx, description, true);
        }

        const result: StepResult = {
          index: i,
          command: cmdKey ?? 'unknown',
          description,
          status: 'failed',
          durationMs: Date.now() - stepStartTime,
          error: error.message,
          ...(screenshotPath !== undefined ? { screenshotPath } : {}),
        };
        stepResults.push(result);
        reporter.onStepResult(result);

        // Mark remaining steps as skipped
        for (let j = i + 1; j < flatSteps.length; j++) {
          const s = flatSteps[j] as Step;
          const k = getCommandKey(s);
          const e2 = k ? COMMAND_REGISTRY[k] : undefined;
          stepResults.push({
            index: j,
            command: k ?? 'unknown',
            description: e2 ? e2.describe(s) : `[${k ?? 'unknown'}]`,
            status: 'skipped',
            durationMs: 0,
          });
        }
        break;
      }
    }

    // Save / discard trace
    if (config.trace !== 'off' && context) {
      const allPassed = stepResults.every((s) => s.status !== 'failed');
      const saveTrace = config.trace === 'on' || (config.trace === 'retain-on-failure' && !allPassed);

      if (saveTrace) {
        fs.mkdirSync(config.artifactsDir, { recursive: true });
        tracePath = path.join(config.artifactsDir, `trace-${spec.name.replace(/\s+/g, '-')}-${Date.now()}.zip`);
        await context.tracing.stop({ path: tracePath });
      } else {
        await context.tracing.stop();
      }
    }

  } catch (err) {
    // Setup/teardown error
    const errMsg = err instanceof Error ? err.message : String(err);
    const specResult: SpecResult = {
      name: spec.name,
      specPath,
      status: 'error',
      steps: [],
      durationMs: Date.now() - startTime,
      passedSteps: 0,
      failedSteps: 0,
      setupError: errMsg,
      attempt,
    };
    reporter.onSpecResult(specResult);
    return specResult;
  } finally {
    try {
      await page?.close();
      await context?.close();
      await browser?.close();
    } catch {
      // Ignore cleanup errors
    }
  }

  const passedSteps = stepResults.filter((s) => s.status === 'passed').length;
  const failedSteps = stepResults.filter((s) => s.status === 'failed').length;
  const status = failedSteps > 0 ? 'failed' : 'passed';

  const specResult: SpecResult = {
    name: spec.name,
    specPath,
    status,
    steps: stepResults,
    durationMs: Date.now() - startTime,
    passedSteps,
    failedSteps,
    ...(tracePath !== undefined ? { tracePath } : {}),
    attempt,
  };

  reporter.onSpecResult(specResult);
  return specResult;
}

// ---------------------------------------------------------------------------
// Multi-spec runner
// ---------------------------------------------------------------------------

export interface RunManyOptions extends RunOptions {
  specPaths: string[];
  parallel?: boolean;
}

export async function runMany(options: RunManyOptions): Promise<RunSummary> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const cwd = options.cwd ?? process.cwd();

  // Build config just for the reporter
  const config = resolveConfig(cwd, buildOverrides(options));

  const reporter = new Reporter(config);
  reporter.onRunStart(options.specPaths);

  const results: SpecResult[] = [];

  if (options.parallel) {
    const settled = await Promise.allSettled(
      options.specPaths.map((specPath) =>
        runSpec({ ...options, specPath, cwd }),
      ),
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results.push(s.value);
      } else {
        // Shouldn't happen — runSpec catches internally
        logger.error(`Unexpected error: ${String(s.reason)}`);
      }
    }
  } else {
    for (const specPath of options.specPaths) {
      const result = await runSpec({ ...options, specPath, cwd });
      results.push(result);
    }
  }

  const passedSpecs = results.filter((r) => r.status === 'passed').length;
  const failedSpecs = results.filter((r) => r.status !== 'passed').length;

  const summary: RunSummary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    passedSpecs,
    failedSpecs,
    totalSpecs: results.length,
    results,
    status: failedSpecs > 0 ? 'failed' : 'passed',
  };

  reporter.onRunComplete(summary);
  return summary;
}

// ---------------------------------------------------------------------------
// Browser launcher
// ---------------------------------------------------------------------------

function launchBrowser(config: ResolvedConfig): Promise<Browser> {
  const browserMap: Record<string, PWBrowserType> = {
    chromium,
    firefox,
    webkit,
  };
  const launcher = browserMap[config.browser];
  if (!launcher) {
    throw new WebSpecError(`Unsupported browser: "${config.browser}". Use chromium, firefox, or webkit.`);
  }
  return launcher.launch({ headless: config.headless });
}

// ---------------------------------------------------------------------------
// Config override builder — strips undefined values for exactOptionalPropertyTypes
// ---------------------------------------------------------------------------

import type { ConfigOverrides } from '../config/resolveConfig';

function buildOverrides(options: RunOptions): ConfigOverrides {
  const overrides: ConfigOverrides = {};
  if (options.browser !== undefined) overrides.browser = options.browser;
  if (options.headed === true) overrides.headless = false;
  if (options.baseUrl !== undefined) overrides.baseUrl = options.baseUrl;
  if (options.screenshot !== undefined) overrides.screenshot = options.screenshot;
  if (options.trace !== undefined) overrides.trace = options.trace;
  if (options.reporters !== undefined) overrides.reporters = options.reporters;
  if (options.timeout !== undefined) overrides.timeout = options.timeout;
  if (options.retries !== undefined) overrides.retries = options.retries;
  if (options.env !== undefined) overrides.env = options.env;
  if (options.configFilePath !== undefined) overrides.configFilePath = options.configFilePath;
  return overrides;
}

// Re-export for programmatic use
export { StepError };
