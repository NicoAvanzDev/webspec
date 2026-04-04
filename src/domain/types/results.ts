/**
 * Runtime result types for spec execution.
 */

export type StepStatus = 'passed' | 'failed' | 'skipped';
export type SpecStatus = 'passed' | 'failed' | 'error';

export interface StepResult {
  readonly index: number;
  readonly command: string;
  readonly description: string;
  readonly status: StepStatus;
  readonly durationMs: number;
  readonly error?: string;
  readonly screenshotPath?: string;
}

export interface SpecResult {
  readonly name: string;
  readonly specPath: string;
  readonly status: SpecStatus;
  readonly steps: readonly StepResult[];
  readonly durationMs: number;
  readonly passedSteps: number;
  readonly failedSteps: number;
  readonly setupError?: string;
  readonly tracePath?: string;
  readonly attempt: number;
}

export interface RunSummary {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly passedSpecs: number;
  readonly failedSpecs: number;
  readonly totalSpecs: number;
  readonly results: readonly SpecResult[];
  readonly status: SpecStatus;
}
