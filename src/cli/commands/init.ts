/**
 * `webspec init` — scaffold a new WebSpec project.
 *
 * Creates:
 *   - webspec.config.yaml
 *   - tests/specs/  (with an example spec)
 *   - tests/flows/  (with an example flow)
 *   - .gitignore additions
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { Command } from 'commander';
import { exists } from '../../utils/fs';
import { logger } from '../../utils/logging';

const CONFIG_TEMPLATE = `# webspec.config.yaml
# Full documentation: https://github.com/webspec/webspec/docs/config.md

baseUrl: ""          # e.g. https://example.com
browser: chromium    # chromium | firefox | webkit
headless: true
timeout: 10000       # ms
retries: 0

specsDir: tests/specs
flowsDir: tests/flows
artifactsDir: webspec-artifacts

screenshot: only-on-failure   # on | off | only-on-failure
trace: off                     # on | off | retain-on-failure

reporters:
  - console
  # - json
  # - junit

# env:
#   BASE_URL: \${BASE_URL:-https://example.com}
`;

const EXAMPLE_SPEC = `# tests/specs/example.spec.yaml
name: example - homepage visible
description: Verify the homepage loads and shows the main heading.
baseUrl: https://example.com

steps:
  - navigate: /
  - assertVisible:
      role: heading
      name: Example Domain
  - assertTitle: Example Domain
`;

const EXAMPLE_FLOW = `# tests/flows/visit-home.yaml
name: visit-home flow
description: Navigate to the homepage. Reuse this in other specs.

steps:
  - navigate: /
  - waitForNetworkIdle:
`;

const GITIGNORE_ADDITION = `
# WebSpec artifacts
webspec-artifacts/
`;

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Scaffold a WebSpec project (config, spec dirs, example spec)')
    .option('--cwd <dir>', 'Working directory (default: current directory)')
    .option('--force', 'Overwrite existing files without prompting')
    .action(async (opts: { cwd?: string; force?: boolean }) => {
      const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();
      const force = opts.force ?? false;

      logger.section('webspec init');

      const configPath = path.join(cwd, 'webspec.config.yaml');
      const specsDir = path.join(cwd, 'tests', 'specs');
      const flowsDir = path.join(cwd, 'tests', 'flows');
      const exampleSpec = path.join(specsDir, 'example.spec.yaml');
      const exampleFlow = path.join(flowsDir, 'visit-home.yaml');

      // Guard: config already exists
      if (exists(configPath) && !force) {
        logger.warn(`webspec.config.yaml already exists. Use --force to overwrite.`);
      } else {
        const spinner = ora('Writing webspec.config.yaml').start();
        fs.writeFileSync(configPath, CONFIG_TEMPLATE, 'utf-8');
        spinner.succeed(`webspec.config.yaml`);
      }

      // Create directories
      fs.mkdirSync(specsDir, { recursive: true });
      fs.mkdirSync(flowsDir, { recursive: true });
      logger.success(`Created tests/specs/ and tests/flows/`);

      // Write example spec
      if (!exists(exampleSpec) || force) {
        fs.writeFileSync(exampleSpec, EXAMPLE_SPEC, 'utf-8');
        logger.success(`tests/specs/example.spec.yaml`);
      } else {
        logger.warn(`tests/specs/example.spec.yaml already exists (skip).`);
      }

      // Write example flow
      if (!exists(exampleFlow) || force) {
        fs.writeFileSync(exampleFlow, EXAMPLE_FLOW, 'utf-8');
        logger.success(`tests/flows/visit-home.yaml`);
      } else {
        logger.warn(`tests/flows/visit-home.yaml already exists (skip).`);
      }

      // .gitignore
      const gitignorePath = path.join(cwd, '.gitignore');
      if (exists(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        if (!content.includes('webspec-artifacts')) {
          fs.appendFileSync(gitignorePath, GITIGNORE_ADDITION, 'utf-8');
          logger.success(`.gitignore updated`);
        }
      }

      logger.plain('');
      logger.plain(chalk.bold('Next steps:'));
      logger.plain(`  1. Edit ${chalk.cyan('webspec.config.yaml')} and set your baseUrl`);
      logger.plain(`  2. Run ${chalk.cyan('webspec run tests/specs/example.spec.yaml')}`);
      logger.plain(`  3. Add more specs in ${chalk.cyan('tests/specs/')}`);
      logger.plain('');
    });
}
