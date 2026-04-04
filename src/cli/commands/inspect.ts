/**
 * `webspec inspect` — show the normalised + env-resolved spec without running it.
 * Useful for agent debugging and verifying spec resolution.
 */

import * as path from 'path';
import chalk from 'chalk';
import type { Command } from 'commander';
import { parseSpec } from '../../core/parseSpec';
import { normaliseSteps } from '../../core/normalizeSpec';
import { resolveEnv } from '../../core/resolveEnv';
import { resolveConfig } from '../../config/resolveConfig';
import { stringifyYaml } from '../../utils/yaml';
import { formatError } from '../../utils/errors';
import { logger } from '../../utils/logging';

export function registerInspect(program: Command): void {
  program
    .command('inspect <path>')
    .description('Show the normalised spec after config and env resolution (no browser launched)')
    .option('--env <KEY=VALUE>', 'Set an environment variable (repeatable)', collect, [])
    .option('--base-url <url>', 'Override baseUrl')
    .option('--cwd <dir>', 'Working directory')
    .option('--config <path>', 'Path to webspec.config.yaml')
    .action((specPath: string, opts: { env?: string[]; baseUrl?: string; cwd?: string; config?: string }) => {
      const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();
      const absPath = path.resolve(cwd, specPath);

      const envOverrides: Record<string, string> = {};
      for (const kv of (opts.env ?? [])) {
        const eq = kv.indexOf('=');
        if (eq !== -1) {
          envOverrides[kv.slice(0, eq)] = kv.slice(eq + 1);
        }
      }

      try {
        const spec = parseSpec(absPath);
        const inspectOverrides: import('../../config/resolveConfig').ConfigOverrides = {};
        if (opts.baseUrl) inspectOverrides.baseUrl = opts.baseUrl;
        if (opts.config) inspectOverrides.configFilePath = opts.config;
        if (Object.keys(envOverrides).length > 0) inspectOverrides.env = envOverrides;
        const config = resolveConfig(cwd, inspectOverrides, spec);

        const env: Record<string, string> = { ...config.env, ...(spec.env ?? {}), ...envOverrides };
        const normalised = normaliseSteps(spec.steps);
        const resolved = resolveEnv(normalised, env);

        const output = {
          name: spec.name,
          description: spec.description,
          resolvedBaseUrl: config.baseUrl || '(none)',
          resolvedBrowser: config.browser,
          resolvedTimeout: config.timeout,
          env,
          steps: resolved,
        };

        logger.section('Inspected spec: ' + path.relative(cwd, absPath));
        logger.plain(chalk.dim(stringifyYaml(output)));
      } catch (err) {
        logger.error(formatError(err));
        process.exit(1);
      }
    });
}

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
