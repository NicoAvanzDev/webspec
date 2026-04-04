#!/usr/bin/env node
/**
 * WebSpec CLI entry point.
 *
 * Commands:
 *   webspec init
 *   webspec generate
 *   webspec validate
 *   webspec run
 *   webspec inspect
 *   webspec doctor
 *   webspec archive
 *   webspec install
 */

import { Command } from 'commander';
import { registerInit } from './commands/init';
import { registerGenerate } from './commands/generate';
import { registerValidate } from './commands/validate';
import { registerRun } from './commands/run';
import { registerInspect } from './commands/inspect';
import { registerDoctor } from './commands/doctor';
import { registerArchive } from './commands/archive';
import { registerInstall } from './commands/install';

const pkg = require('../../package.json') as { version: string };

const program = new Command();

program
  .name('webspec')
  .description(
    'WebSpec — declarative browser-automation specs for websites.\n' +
    'Web-only. No mobile. Playwright-powered.',
  )
  .version(pkg.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help');

// Register all sub-commands
registerInit(program);
registerGenerate(program);
registerValidate(program);
registerRun(program);
registerInspect(program);
registerDoctor(program);
registerArchive(program);
registerInstall(program);

// Show help if no sub-command given
program.addHelpText(
  'after',
  '\nDocumentation: https://github.com/webspec/webspec/tree/main/docs',
);

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
