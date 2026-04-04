/**
 * Console reporter — prints coloured step-by-step output during a run.
 */

import chalk from 'chalk';
import type { RunSummary, SpecResult, StepResult } from '../../types/results';

export function reportRunStart(specPaths: string[]): void {
  process.stdout.write(
    `\n${chalk.bold.cyan('WebSpec')} ${chalk.dim('—')} running ${chalk.bold(String(specPaths.length))} spec${specPaths.length === 1 ? '' : 's'}\n\n`,
  );
}

export function reportSpecStart(specName: string, specPath: string): void {
  process.stdout.write(
    `${chalk.bold(specName)} ${chalk.dim(specPath)}\n`,
  );
}

export function reportStepResult(step: StepResult): void {
  const dur = chalk.dim(` (${step.durationMs}ms)`);
  if (step.status === 'passed') {
    process.stdout.write(`  ${chalk.green('✓')} ${step.description}${dur}\n`);
  } else if (step.status === 'failed') {
    process.stderr.write(`  ${chalk.red('✗')} ${chalk.red(step.description)}${dur}\n`);
    if (step.error) {
      process.stderr.write(`    ${chalk.dim(step.error.split('\n')[0] ?? '')}\n`);
    }
    if (step.screenshotPath) {
      process.stderr.write(`    ${chalk.dim('Screenshot: ' + step.screenshotPath)}\n`);
    }
  } else {
    process.stdout.write(`  ${chalk.gray('–')} ${chalk.gray(step.description)} (skipped)\n`);
  }
}

export function reportSpecResult(result: SpecResult): void {
  const icon = result.status === 'passed' ? chalk.green('✓') : chalk.red('✗');
  const dur = chalk.dim(`${result.durationMs}ms`);
  const label = result.status === 'passed'
    ? chalk.green('passed')
    : chalk.red('failed');

  process.stdout.write(
    `${icon} ${chalk.bold(result.name)} ${label} ${dur}\n`,
  );

  if (result.setupError) {
    process.stderr.write(`  ${chalk.red('Setup error:')} ${result.setupError}\n`);
  }
  if (result.tracePath) {
    process.stdout.write(`  ${chalk.dim('Trace: ' + result.tracePath)}\n`);
  }
  process.stdout.write('\n');
}

export function reportSummary(summary: RunSummary): void {
  const { passedSpecs, failedSpecs, totalSpecs, durationMs } = summary;
  const allPassed = failedSpecs === 0;

  const line =
    `${allPassed ? chalk.green('✓') : chalk.red('✗')} ` +
    `${chalk.bold(String(totalSpecs))} spec${totalSpecs === 1 ? '' : 's'} — ` +
    `${chalk.green(String(passedSpecs) + ' passed')}` +
    (failedSpecs > 0 ? `, ${chalk.red(String(failedSpecs) + ' failed')}` : '') +
    `  ${chalk.dim(durationMs + 'ms')}`;

  process.stdout.write(`\n${chalk.dim('─'.repeat(50))}\n${line}\n\n`);
}
