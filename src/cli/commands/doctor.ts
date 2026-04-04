/**
 * `webspec doctor` — check environment, dependencies, and configuration.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import chalk from 'chalk';
import type { Command } from 'commander';
import { loadConfig } from '../../config/loadConfig';
import { logger } from '../../utils/logging';

interface CheckResult {
  label: string;
  status: 'ok' | 'warn' | 'fail';
  detail?: string;
}

function check(label: string, status: 'ok' | 'warn' | 'fail', detail?: string): CheckResult {
  return { label, status, ...(detail !== undefined ? { detail } : {}) };
}

function printCheck(c: CheckResult): void {
  const icon =
    c.status === 'ok' ? chalk.green('✓') : c.status === 'warn' ? chalk.yellow('!') : chalk.red('✗');
  const text = c.status === 'fail' ? chalk.red(c.label) : c.label;
  const detail = c.detail ? chalk.dim(` — ${c.detail}`) : '';
  process.stdout.write(`  ${icon} ${text}${detail}\n`);
}

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Check runtime environment, dependencies, and WebSpec configuration')
    .option('--cwd <dir>', 'Working directory')
    .action((opts: { cwd?: string }) => {
      const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();

      logger.section('webspec doctor');

      const checks: CheckResult[] = [];

      // Node version
      const nodeVersion = process.version;
      const major = parseInt(nodeVersion.slice(1), 10);
      checks.push(
        check(
          `Node.js ${nodeVersion}`,
          major >= 18 ? 'ok' : 'fail',
          major < 18 ? 'WebSpec requires Node.js >= 18' : undefined,
        ),
      );

      // Playwright installed
      try {
        const pwPkg = path.join(require.resolve('playwright'), '..', '..', 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pwPkg, 'utf-8')) as { version: string };
        checks.push(check(`playwright@${pkg.version}`, 'ok'));
      } catch {
        checks.push(check('playwright', 'fail', 'Run: pnpm add playwright @playwright/test'));
      }

      // Playwright browsers
      try {
        const result = child_process.spawnSync('npx', ['playwright', 'install', '--dry-run'], {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        const missing = result.stdout?.includes('Downloading') || result.stderr?.includes('not found');
        if (missing) {
          checks.push(check('Playwright browsers', 'warn', 'Run: npx playwright install'));
        } else {
          checks.push(check('Playwright browsers', 'ok', 'all browsers present'));
        }
      } catch {
        checks.push(check('Playwright browsers', 'warn', 'Could not verify — run: npx playwright install'));
      }

      // Config file
      try {
        const { configFilePath } = loadConfig(cwd);
        if (configFilePath) {
          checks.push(check(`webspec.config.yaml`, 'ok', configFilePath));
        } else {
          checks.push(check('webspec.config.yaml', 'warn', 'No config found — run: webspec init'));
        }
      } catch (err) {
        checks.push(check('webspec.config.yaml', 'fail', (err as Error).message));
      }

      // Specs directory
      const specsDir = path.join(cwd, 'tests', 'specs');
      const flowsDir = path.join(cwd, 'tests', 'flows');
      checks.push(
        check('tests/specs/', fs.existsSync(specsDir) ? 'ok' : 'warn', fs.existsSync(specsDir) ? undefined : 'Run: webspec init'),
      );
      checks.push(
        check('tests/flows/', fs.existsSync(flowsDir) ? 'ok' : 'warn', undefined),
      );

      for (const c of checks) {
        printCheck(c);
      }

      const failed = checks.filter((c) => c.status === 'fail').length;
      const warned = checks.filter((c) => c.status === 'warn').length;

      logger.plain('');
      if (failed > 0) {
        logger.error(`${failed} check(s) failed. Fix the issues above before running specs.`);
        process.exit(1);
      } else if (warned > 0) {
        logger.warn(`${warned} warning(s). WebSpec may work but some features could be limited.`);
      } else {
        logger.success('All checks passed. WebSpec is ready.');
      }
    });
}
