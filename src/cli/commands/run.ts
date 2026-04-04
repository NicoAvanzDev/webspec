/**
 * `webspec run` — execute one or more .spec.yaml files.
 */

import * as path from 'path';
import type { Command } from 'commander';
import { resolveSpecPaths } from '../../utils/fs';
import { runMany } from '../../runtime/runner';
import { formatError } from '../../utils/errors';
import { logger } from '../../utils/logging';
import type { ResolvedConfig } from '../../types/config';

interface RunCliOptions {
  headed?: boolean;
  browser?: string;
  grep?: string;
  env?: string[];
  reporter?: string[];
  trace?: string;
  screenshot?: string;
  baseUrl?: string;
  parallel?: boolean;
  timeout?: string;
  retries?: string;
  cwd?: string;
  config?: string;
}

export function registerRun(program: Command): void {
  program
    .command('run [paths...]')
    .description('Run one or more .spec.yaml files against a browser')
    .option('--headed', 'Run in headed (visible) browser mode')
    .option('--browser <name>', 'Browser to use: chromium (default), firefox, webkit')
    .option('--grep <pattern>', 'Only run specs whose name matches the pattern')
    .option('--env <KEY=VALUE>', 'Set an environment variable (repeatable)', collect, [])
    .option('--reporter <name>', 'Reporter: console, json, junit (repeatable)', collect, [])
    .option('--trace <mode>', 'Trace mode: on | off | retain-on-failure')
    .option('--screenshot <mode>', 'Screenshot mode: on | off | only-on-failure')
    .option('--base-url <url>', 'Override baseUrl from config/spec')
    .option('--parallel', 'Run specs in parallel')
    .option('--timeout <ms>', 'Default step timeout in milliseconds')
    .option('--retries <n>', 'Number of retries per spec')
    .option('--cwd <dir>', 'Working directory')
    .option('--config <path>', 'Path to webspec.config.yaml')
    .action(async (paths: string[], opts: RunCliOptions) => {
      const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();

      // Resolve spec paths
      let specPaths: string[] = [];

      if (paths.length > 0) {
        for (const p of paths) {
          const resolved = await resolveSpecPaths(p, cwd);
          specPaths.push(...resolved);
        }
      } else {
        // Default: run all specs in the specsDir
        const defaultSpecsDir = path.join(cwd, 'tests', 'specs');
        specPaths = await resolveSpecPaths(defaultSpecsDir, cwd);
      }

      if (specPaths.length === 0) {
        logger.error('No .spec.yaml files found. Provide paths or configure specsDir.');
        process.exit(1);
      }

      // Filter by --grep
      if (opts.grep) {
        const pattern = new RegExp(opts.grep, 'i');
        specPaths = specPaths.filter((p) => pattern.test(path.basename(p)));
        if (specPaths.length === 0) {
          logger.warn(`No specs matched --grep "${opts.grep}"`);
          process.exit(0);
        }
      }

      // Parse env overrides
      const envOverrides: Record<string, string> = {};
      for (const kv of (opts.env ?? [])) {
        const eq = kv.indexOf('=');
        if (eq === -1) {
          logger.warn(`Invalid --env value: "${kv}" (expected KEY=VALUE)`);
          continue;
        }
        const k = kv.slice(0, eq);
        const v = kv.slice(eq + 1);
        envOverrides[k] = v;
      }

      try {
        const runOpts: import('../../runtime/runner').RunManyOptions = { specPaths, cwd };
        if (opts.headed) runOpts.headed = opts.headed;
        if (opts.browser) runOpts.browser = opts.browser as ResolvedConfig['browser'];
        if (Object.keys(envOverrides).length > 0) runOpts.env = envOverrides;
        if (opts.baseUrl) runOpts.baseUrl = opts.baseUrl;
        if (opts.screenshot) runOpts.screenshot = opts.screenshot as ResolvedConfig['screenshot'];
        if (opts.trace) runOpts.trace = opts.trace as ResolvedConfig['trace'];
        if (opts.reporter && opts.reporter.length > 0) {
          runOpts.reporters = opts.reporter as ResolvedConfig['reporters'];
        }
        if (opts.parallel) runOpts.parallel = true;
        if (opts.timeout) runOpts.timeout = parseInt(opts.timeout, 10);
        if (opts.retries) runOpts.retries = parseInt(opts.retries, 10);
        if (opts.config) runOpts.configFilePath = opts.config;

        const summary = await runMany(runOpts);

        process.exit(summary.status === 'passed' ? 0 : 1);
      } catch (err) {
        logger.error(formatError(err));
        process.exit(1);
      }
    });
}

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
