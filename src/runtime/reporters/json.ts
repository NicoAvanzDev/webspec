/**
 * JSON reporter — writes a run-summary.json to the artifacts directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RunSummary } from '../../types/results';

export function writeJsonReport(summary: RunSummary, artifactsDir: string): string {
  fs.mkdirSync(artifactsDir, { recursive: true });
  const outputPath = path.join(artifactsDir, 'run-summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf-8');
  return outputPath;
}
