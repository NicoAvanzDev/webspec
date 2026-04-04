/**
 * `webspec install` — install agent harness files into the current repo.
 *
 * Installs for each chosen harness:
 *   - A SKILL.md reference guide
 *   - Slash command files: /webspec:run, /webspec:draft, /webspec:validate, /webspec:inspect
 *
 * Supported harnesses: claude (Claude Code), codex (Codex), opencode (OpenCode)
 *
 * Usage:
 *   webspec install                         # interactive multi-select
 *   webspec install --tools all             # install all harnesses
 *   webspec install --tools claude,opencode # install specific harnesses
 *   webspec install --tools none            # no-op (exits cleanly)
 */

import * as path from 'path';
import chalk from 'chalk';
import type { Command } from 'commander';
import { logger } from '../../utils/logging';
import { checkbox } from '../ui/checkbox';
import { installHarnesses } from '../../agent/installer';
import { HARNESSES, ALL_HARNESS_IDS, type HarnessId } from '../../agent/harnesses';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse the --tools flag value into a list of HarnessId values.
 * Accepts: "all", "none", or a comma-separated list of harness IDs.
 * Throws a user-facing error for unknown IDs.
 */
function parseToolsFlag(raw: string): HarnessId[] {
  const trimmed = raw.trim().toLowerCase();

  if (trimmed === 'all') return [...ALL_HARNESS_IDS];
  if (trimmed === 'none') return [];

  const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = parts.filter((p) => !(p in HARNESSES));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown harness(es): ${unknown.join(', ')}. ` +
      `Valid options: ${ALL_HARNESS_IDS.join(', ')}, all, none`,
    );
  }

  return parts as HarnessId[];
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerInstall(program: Command): void {
  program
    .command('install')
    .description(
      'Install agent harness files (SKILL.md + slash commands) into this repo',
    )
    .option(
      '--tools <list>',
      'Harnesses to install: all | none | comma-separated (claude,codex,opencode)',
    )
    .option('--cwd <dir>', 'Working directory (default: current directory)')
    .action(async (opts: { tools?: string; cwd?: string }) => {
      const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();

      logger.section('webspec install');

      // -----------------------------------------------------------------------
      // Resolve which harnesses to install
      // -----------------------------------------------------------------------

      let harnessIds: HarnessId[];

      if (opts.tools !== undefined) {
        // Non-interactive mode
        let parsed: HarnessId[];
        try {
          parsed = parseToolsFlag(opts.tools);
        } catch (err) {
          logger.error((err as Error).message);
          process.exit(1);
        }

        if (parsed.length === 0) {
          logger.info('No harnesses selected (--tools none). Nothing to install.');
          return;
        }

        harnessIds = parsed;
      } else {
        // Interactive mode — checkbox prompt
        const isTTY = Boolean(process.stdin.isTTY);

        if (!isTTY) {
          logger.error(
            'stdin is not a TTY. Use --tools <list> for non-interactive mode.',
          );
          process.exit(1);
        }

        logger.plain(
          chalk.dim(
            'Select the agent harnesses to configure (space to toggle, enter to confirm):',
          ),
        );
        logger.plain('');

        const selected = await checkbox({
          message: 'Which harnesses should WebSpec configure?',
          choices: ALL_HARNESS_IDS.map((id) => ({
            name: HARNESSES[id].name,
            value: id,
            checked: true,
          })),
        });

        if (selected.length === 0) {
          logger.info('No harnesses selected. Nothing to install.');
          return;
        }

        harnessIds = selected as HarnessId[];
      }

      // -----------------------------------------------------------------------
      // Run installation
      // -----------------------------------------------------------------------

      const result = installHarnesses(harnessIds, cwd);

      logger.plain('');

      let totalInstalled = 0;
      let totalUpdated = 0;

      for (const harness of result.harnesses) {
        logger.plain(chalk.bold(harness.harnesName));

        for (const file of harness.files) {
          const rel = path.relative(cwd, file.filePath);
          if (file.status === 'installed') {
            logger.success(`${rel}`);
            totalInstalled++;
          } else {
            logger.info(`${rel} ${chalk.dim('(updated)')}`);
            totalUpdated++;
          }
        }

        logger.plain('');
      }

      // Summary
      const parts: string[] = [];
      if (totalInstalled > 0) parts.push(`${totalInstalled} installed`);
      if (totalUpdated > 0) parts.push(`${totalUpdated} updated`);
      logger.plain(chalk.bold('Done: ') + parts.join(', '));

      // Invocation hints
      logger.plain('');
      logger.plain(chalk.bold('Slash commands available:'));
      for (const id of harnessIds) {
        const harness = HARNESSES[id];
        logger.plain(
          `  ${chalk.cyan(harness.name)}: ` +
          ['run', 'draft', 'validate', 'inspect']
            .map((cmd) => chalk.yellow(harness.invocation(cmd)))
            .join('  '),
        );
      }
      logger.plain('');
    });
}
