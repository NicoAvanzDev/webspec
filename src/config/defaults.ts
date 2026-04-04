/**
 * Built-in defaults for WebSpec.
 * These are the lowest-precedence values; everything else can override them.
 */

import * as path from 'path';
import type { ResolvedConfig } from '../types/config';

export function buildDefaults(cwd: string): ResolvedConfig {
  return {
    baseUrl: '',
    browser: 'chromium',
    viewport: { width: 1280, height: 720 },
    headless: true,
    timeout: 10000,
    retries: 0,
    specsDir: path.join(cwd, 'tests', 'specs'),
    flowsDir: path.join(cwd, 'tests', 'flows'),
    screenshotsDir: path.join(cwd, 'webspec-artifacts', 'screenshots'),
    artifactsDir: path.join(cwd, 'webspec-artifacts'),
    screenshot: 'only-on-failure',
    trace: 'off',
    reporters: ['console'],
    env: {},
  };
}
