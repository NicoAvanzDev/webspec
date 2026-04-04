/**
 * TypeScript types for WebSpec run results.
 */

export type StepStatus = 'passed' | 'failed' | 'skipped';
export type SpecStatus = 'passed' | 'failed' | 'error';

export interface StepResult {
  /** Step index (0-based). */
  index: number;
  /** The command key, e.g. "click", "assertVisible". */
  command: string;
  /** Human-readable description of the step. */
  description: string;
  status: StepStatus;
  /** Duration in ms. */
  durationMs: number;
  /** Error message if failed. */
  error?: string;
  /** Path to screenshot taken on failure. */
  screenshotPath?: string;
}

export interface SpecResult {
  /** Name from the spec file. */
  name: string;
  /** Absolute path to the spec file. */
  specPath: string;
  status: SpecStatus;
  steps: StepResult[];
  /** Total duration in ms (wall clock). */
  durationMs: number;
  /** Number of steps that passed. */
  passedSteps: number;
  /** Number of steps that failed. */
  failedSteps: number;
  /** Path to Playwright trace archive (if enabled). */
  tracePath?: string;
  /** Error message if spec failed before any steps ran. */
  setupError?: string;
  /** Attempt number (1-based, for retries). */
  attempt: number;
}

export interface RunSummary {
  /** Timestamp of run start (ISO 8601). */
  startedAt: string;
  /** Timestamp of run end (ISO 8601). */
  finishedAt: string;
  /** Total wall-clock duration in ms. */
  durationMs: number;
  /** Number of specs that passed. */
  passedSpecs: number;
  /** Number of specs that failed. */
  failedSpecs: number;
  /** Total specs run. */
  totalSpecs: number;
  results: SpecResult[];
  /** Overall exit status. */
  status: 'passed' | 'failed';
}
