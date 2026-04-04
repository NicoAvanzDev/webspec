/**
 * TypeScript types for webspec.config.yaml.
 *
 * Precedence (highest → lowest):
 *   CLI flags > process.env > spec file fields > config file > built-in defaults
 */

import type { BrowserType, ViewportSpec } from './spec';

export type ScreenshotMode = 'on' | 'off' | 'only-on-failure';
export type TraceMode = 'on' | 'off' | 'retain-on-failure';
export type ReporterType = 'console' | 'json' | 'junit';

export interface WebSpecConfig {
  /** Base URL prepended to relative navigate paths. */
  baseUrl?: string;
  /** Default browser (default: chromium). */
  browser?: BrowserType;
  /** Default viewport dimensions. */
  viewport?: ViewportSpec;
  /** Run headless by default (default: true). */
  headless?: boolean;
  /** Default step timeout in ms (default: 10000). */
  timeout?: number;
  /** Default retries per spec (default: 0). */
  retries?: number;

  /** Directory containing spec files (default: tests/specs). */
  specsDir?: string;
  /** Directory containing reusable flow files (default: tests/flows). */
  flowsDir?: string;
  /** Directory for screenshots (default: webspec-artifacts/screenshots). */
  screenshotsDir?: string;
  /** Directory for all artifacts: traces, reports, etc. (default: webspec-artifacts). */
  artifactsDir?: string;

  /** Screenshot capture mode (default: only-on-failure). */
  screenshot?: ScreenshotMode;
  /** Trace capture mode (default: off). */
  trace?: TraceMode;

  /** Reporters to activate (default: ["console"]). */
  reporters?: ReporterType[];

  /** Environment variable defaults (lowest precedence). */
  env?: Record<string, string>;
}

/** Fully resolved config — all fields present, no optionals. */
export interface ResolvedConfig {
  baseUrl: string;
  browser: BrowserType;
  viewport: ViewportSpec;
  headless: boolean;
  timeout: number;
  retries: number;
  specsDir: string;
  flowsDir: string;
  screenshotsDir: string;
  artifactsDir: string;
  screenshot: ScreenshotMode;
  trace: TraceMode;
  reporters: ReporterType[];
  env: Record<string, string>;
  /** Absolute path to the config file (undefined if not found). */
  configFilePath?: string;
}
