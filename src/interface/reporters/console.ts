/**
 * Console reporter implementation.
 */

import type { SpecResult, StepResult, RunSummary } from '../../domain/index';

export interface Reporter {
  onRunStart(specPaths: readonly string[]): void;
  onSpecStart(name: string, specPath: string): void;
  onStepResult(result: StepResult): void;
  onSpecResult(result: SpecResult): void;
  onRunComplete(summary: RunSummary): void;
}

/**
 * Console reporter that outputs to stdout/stderr.
 */
export class ConsoleReporter implements Reporter {
  private stepCount = 0;

  onRunStart(specPaths: readonly string[]): void {
    console.log(`Running ${specPaths.length} spec(s)...\n`);
  }

  onSpecStart(name: string): void {
    console.log(`  ${name}`);
    this.stepCount = 0;
  }

  onStepResult(result: StepResult): void {
    this.stepCount++;
    const symbol = result.status === 'passed' ? '✓' : result.status === 'failed' ? '✗' : '○';
    const duration =
      result.durationMs > 1000
        ? `(${Math.round(result.durationMs / 1000)}s)`
        : `(${result.durationMs}ms)`;
    console.log(`    ${symbol} ${result.description} ${duration}`);

    if (result.error !== undefined) {
      console.log(`      Error: ${result.error}`);
    }
  }

  onSpecResult(result: SpecResult): void {
    const symbol = result.status === 'passed' ? '✓' : '✗';
    const duration =
      result.durationMs > 1000
        ? `${Math.round(result.durationMs / 1000)}s`
        : `${result.durationMs}ms`;

    if (result.setupError !== undefined) {
      console.log(`\n  ${symbol} ${result.name} [${duration}]`);
      console.log(`    Setup error: ${result.setupError}`);
    } else {
      const summary = `${result.passedSteps}/${result.steps.length} steps passed`;
      console.log(`\n  ${symbol} ${result.name} [${duration}] - ${summary}`);
    }
  }

  onRunComplete(summary: RunSummary): void {
    const symbol = summary.status === 'passed' ? '✓' : '✗';
    const duration =
      summary.durationMs > 1000
        ? `${Math.round(summary.durationMs / 1000)}s`
        : `${summary.durationMs}ms`;

    console.log(
      `\n${symbol} ${summary.passedSpecs}/${summary.totalSpecs} specs passed [${duration}]`,
    );

    if (summary.failedSpecs > 0) {
      process.exitCode = 1;
    }
  }
}

/**
 * JSON reporter that outputs structured data.
 */
export class JsonReporter implements Reporter {
  private results: SpecResult[] = [];

  onRunStart(): void {
    this.results = [];
  }

  onSpecStart(): void {
    // No-op for JSON reporter
  }

  onStepResult(): void {
    // No-op for JSON reporter
  }

  onSpecResult(result: SpecResult): void {
    this.results.push(result);
  }

  onRunComplete(summary: RunSummary): void {
    console.log(JSON.stringify({ summary, results: this.results }, null, 2));
  }
}

/**
 * Multi-reporter that delegates to multiple reporters.
 */
export class MultiReporter implements Reporter {
  constructor(private readonly reporters: readonly Reporter[]) {}

  onRunStart(specPaths: readonly string[]): void {
    for (const reporter of this.reporters) {
      reporter.onRunStart(specPaths);
    }
  }

  onSpecStart(name: string, specPath: string): void {
    for (const reporter of this.reporters) {
      reporter.onSpecStart(name, specPath);
    }
  }

  onStepResult(result: StepResult): void {
    for (const reporter of this.reporters) {
      reporter.onStepResult(result);
    }
  }

  onSpecResult(result: SpecResult): void {
    for (const reporter of this.reporters) {
      reporter.onSpecResult(result);
    }
  }

  onRunComplete(summary: RunSummary): void {
    for (const reporter of this.reporters) {
      reporter.onRunComplete(summary);
    }
  }
}
