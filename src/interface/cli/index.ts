#!/usr/bin/env node
/**
 * WebSpec CLI entry point.
 *
 * Commands:
 *   webspec init      - Scaffold project config and example spec
 *   webspec run       - Run one or more specs
 *   webspec validate  - Validate specs without running
 *   webspec inspect   - Inspect a URL and suggest a spec
 *   webspec doctor    - Check Playwright and environment
 *   webspec archive   - Archive a spec with its metadata
 *   webspec install   - Install agent harness files
 */

import { Command } from 'commander';

const pkg = require('../../package.json') as { version: string };

const program = new Command();

program
  .name('webspec')
  .description(
    'WebSpec — declarative browser-automation specs for websites.\nWeb-only. No mobile. Playwright-powered.',
  )
  .version(pkg.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help');

// Placeholder commands - to be implemented
program
  .command('init')
  .description('Scaffold project config and example spec')
  .action(() => {
    console.log('Init command - to be implemented');
  });

program
  .command('run [specs...]')
  .description('Run one or more specs')
  .option('--headed', 'Run browser in headed mode')
  .option('--browser <browser>', 'Browser to use (chromium, firefox, webkit)')
  .option('--base-url <url>', 'Base URL for relative navigations')
  .option('-t, --tags <tags>', 'Filter specs by tags (comma-separated)')
  .action(
    async (
      specs: string[],
      options: { headed?: boolean; browser?: string; baseUrl?: string; tags?: string },
    ) => {
      const { runMany } = await import('../../application/services/runner');
      const { resolveSpecPaths } = await import('../../infrastructure/persistence/glob');
      const cwd = process.cwd();

      const specPaths =
        specs.length > 0
          ? await resolveSpecPaths(specs[0] ?? '.', cwd)
          : await resolveSpecPaths('tests/specs', cwd);

      const tags = options.tags?.split(',').map((t) => t.trim()) ?? [];

      await runMany({
        specPaths,
        headed: options.headed ?? false,
        browser: options.browser as 'chromium' | 'firefox' | 'webkit',
        baseUrl: options.baseUrl ?? '',
        tags,
        cwd,
      });
    },
  );

program
  .command('validate [specs...]')
  .description('Validate specs without running')
  .action(() => {
    console.log('Validate command - to be implemented');
  });

program
  .command('inspect <url>')
  .description('Inspect a URL and suggest a spec')
  .action(() => {
    console.log('Inspect command - to be implemented');
  });

program
  .command('doctor')
  .description('Check Playwright and environment')
  .action(() => {
    console.log('Doctor command - to be implemented');
  });

program
  .command('archive <spec>')
  .description('Archive a spec with its metadata')
  .action(() => {
    console.log('Archive command - to be implemented');
  });

program
  .command('install')
  .description('Install agent harness files into this repo')
  .action(() => {
    console.log('Install command - to be implemented');
  });

program.addHelpText('after', '\nDocumentation: https://github.com/webspec/webspec/tree/main/docs');

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
