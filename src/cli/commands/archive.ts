/**
 * `webspec archive` — store spec + execution metadata in a dated artifact folder.
 *
 * Creates a timestamped archive under artifactsDir/archive/<timestamp>/:
 *   - spec.yaml         (copy of the spec)
 *   - run-summary.json  (if a previous run produced one)
 *   - prompt.txt        (optional agent prompt that generated the spec)
 *   - metadata.json     (timestamp, spec name, git hash if available)
 */

import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import type { Command } from 'commander';
import { loadConfig } from '../../config/loadConfig';
import { resolveConfig } from '../../config/resolveConfig';
import { parseSpec } from '../../core/parseSpec';
import { formatError } from '../../utils/errors';
import { logger } from '../../utils/logging';

export function registerArchive(program: Command): void {
  program
    .command('archive <specPath>')
    .description('Archive a spec file and its execution metadata into the artifacts directory')
    .option('--prompt <text>', 'The agent prompt that generated this spec (stored for traceability)')
    .option('--summary <path>', 'Path to a run-summary.json to include')
    .option('--cwd <dir>', 'Working directory')
    .option('--config <path>', 'Path to webspec.config.yaml')
    .action(
      (
        specPath: string,
        opts: { prompt?: string; summary?: string; cwd?: string; config?: string },
      ) => {
        const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();
        const absSpecPath = path.resolve(cwd, specPath);

        try {
          const spec = parseSpec(absSpecPath);
          const config = resolveConfig(cwd, opts.config ? { configFilePath: opts.config } : {});

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const archiveDir = path.join(
            config.artifactsDir,
            'archive',
            `${timestamp}-${spec.name.replace(/\s+/g, '-').slice(0, 40)}`,
          );
          fs.mkdirSync(archiveDir, { recursive: true });

          // Copy spec
          fs.copyFileSync(absSpecPath, path.join(archiveDir, 'spec.yaml'));

          // Copy summary if provided
          if (opts.summary) {
            const summaryPath = path.resolve(cwd, opts.summary);
            if (fs.existsSync(summaryPath)) {
              fs.copyFileSync(summaryPath, path.join(archiveDir, 'run-summary.json'));
            } else {
              logger.warn(`Summary file not found: ${summaryPath}`);
            }
          }

          // Write prompt
          if (opts.prompt) {
            fs.writeFileSync(path.join(archiveDir, 'prompt.txt'), opts.prompt, 'utf-8');
          }

          // Write metadata
          let gitHash: string | undefined;
          try {
            gitHash = child_process
              .execSync('git rev-parse --short HEAD', { cwd, stdio: 'pipe' })
              .toString()
              .trim();
          } catch {
            // Not a git repo
          }

          const metadata = {
            archivedAt: new Date().toISOString(),
            specName: spec.name,
            specPath: absSpecPath,
            gitHash,
          };
          fs.writeFileSync(
            path.join(archiveDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2),
            'utf-8',
          );

          logger.success(`Archived to: ${archiveDir}`);
        } catch (err) {
          logger.error(formatError(err));
          process.exit(1);
        }
      },
    );
}
