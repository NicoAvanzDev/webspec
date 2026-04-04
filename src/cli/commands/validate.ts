/**
 * `webspec validate` — validate one or more .spec.yaml files.
 */

import * as path from 'path';
import chalk from 'chalk';
import type { Command } from 'commander';
import { resolveSpecPaths } from '../../utils/fs';
import { parseSpec } from '../../core/parseSpec';
import { formatError } from '../../utils/errors';
import { logger } from '../../utils/logging';

export function registerValidate(program: Command): void {
  program
    .command('validate [paths...]')
    .description('Validate one or more .spec.yaml files (or entire directories)')
    .option('--cwd <dir>', 'Working directory')
    .action(async (paths: string[], opts: { cwd?: string }) => {
      const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();

      if (paths.length === 0) {
        logger.error('No paths provided. Usage: webspec validate <path|dir> [...]');
        process.exit(1);
      }

      logger.section('webspec validate');

      const specPaths: string[] = [];
      for (const p of paths) {
        const resolved = await resolveSpecPaths(p, cwd);
        specPaths.push(...resolved);
      }

      if (specPaths.length === 0) {
        logger.warn('No .spec.yaml files found at the given paths.');
        process.exit(0);
      }

      let passed = 0;
      let failed = 0;

      for (const specPath of specPaths) {
        const rel = path.relative(cwd, specPath);
        try {
          parseSpec(specPath);
          process.stdout.write(`  ${chalk.green('✓')} ${rel}\n`);
          passed++;
        } catch (err) {
          process.stderr.write(`  ${chalk.red('✗')} ${rel}\n`);
          const msg = formatError(err);
          for (const line of msg.split('\n')) {
            process.stderr.write(`    ${chalk.dim(line)}\n`);
          }
          failed++;
        }
      }

      logger.plain('');
      if (failed === 0) {
        logger.success(`All ${passed} spec(s) are valid.`);
      } else {
        logger.error(`${failed} of ${passed + failed} spec(s) failed validation.`);
        process.exit(1);
      }
    });
}
