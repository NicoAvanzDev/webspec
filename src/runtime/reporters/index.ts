/**
 * Reporter facade — dispatches to enabled reporters.
 */

import type { RunSummary, SpecResult, StepResult } from '../../types/results';
import type { ResolvedConfig } from '../../types/config';
import { reportRunStart, reportSpecStart, reportStepResult, reportSpecResult, reportSummary } from './console';
import { writeJsonReport } from './json';
import { writeJUnitReport } from './junit';

export class Reporter {
  constructor(private readonly config: ResolvedConfig) {}

  onRunStart(specPaths: string[]): void {
    if (this.config.reporters.includes('console')) {
      reportRunStart(specPaths);
    }
  }

  onSpecStart(specName: string, specPath: string): void {
    if (this.config.reporters.includes('console')) {
      reportSpecStart(specName, specPath);
    }
  }

  onStepResult(step: StepResult): void {
    if (this.config.reporters.includes('console')) {
      reportStepResult(step);
    }
  }

  onSpecResult(result: SpecResult): void {
    if (this.config.reporters.includes('console')) {
      reportSpecResult(result);
    }
  }

  onRunComplete(summary: RunSummary): void {
    if (this.config.reporters.includes('console')) {
      reportSummary(summary);
    }
    if (this.config.reporters.includes('json')) {
      const p = writeJsonReport(summary, this.config.artifactsDir);
      if (this.config.reporters.includes('console')) {
        process.stdout.write(`JSON report: ${p}\n`);
      }
    }
    if (this.config.reporters.includes('junit')) {
      const p = writeJUnitReport(summary, this.config.artifactsDir);
      if (this.config.reporters.includes('console')) {
        process.stdout.write(`JUnit report: ${p}\n`);
      }
    }
  }
}
