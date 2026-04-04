/**
 * JUnit XML reporter — writes test-results.xml compatible with CI systems.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RunSummary, SpecResult } from '../../types/results';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function specToTestCase(spec: SpecResult): string {
  const lines: string[] = [];
  lines.push(
    `    <testcase name="${escapeXml(spec.name)}" classname="webspec" time="${(spec.durationMs / 1000).toFixed(3)}">`,
  );
  if (spec.status === 'failed' || spec.status === 'error') {
    const failedStep = spec.steps.find((s) => s.status === 'failed');
    const message = escapeXml(spec.setupError ?? failedStep?.error ?? 'Spec failed');
    lines.push(`      <failure message="${message}"/>`);
  }
  lines.push('    </testcase>');
  return lines.join('\n');
}

export function writeJUnitReport(summary: RunSummary, artifactsDir: string): string {
  const { passedSpecs, failedSpecs, totalSpecs, durationMs, results } = summary;

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="WebSpec" tests="${totalSpecs}" failures="${failedSpecs}" time="${(durationMs / 1000).toFixed(3)}">`,
    `  <testsuite name="webspec" tests="${totalSpecs}" failures="${failedSpecs}" passed="${passedSpecs}" time="${(durationMs / 1000).toFixed(3)}">`,
    ...results.map(specToTestCase),
    '  </testsuite>',
    '</testsuites>',
  ];

  fs.mkdirSync(artifactsDir, { recursive: true });
  const outputPath = path.join(artifactsDir, 'test-results.xml');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  return outputPath;
}
