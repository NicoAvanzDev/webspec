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
  readonly baseUrl?: string;
  /** Default browser (default: chromium). */
  readonly browser?: BrowserType;
  /** Default viewport dimensions. */
  readonly viewport?: ViewportSpec;
  /** Run headless by default (default: true). */
  readonly headless?: boolean;
  /** Default step timeout in ms (default: 10000). */
  readonly timeout?: number;
  /** Default retries per spec (default: 0). */
  readonly retries?: number;

  /** Directory containing spec files (default: tests/specs). */
  readonly specsDir?: string;
  /** Directory containing reusable flow files (default: tests/flows). */
  readonly flowsDir?: string;
  /** Directory for screenshots (default: webspec-artifacts/screenshots). */
  readonly screenshotsDir?: string;
  /** Directory for all artifacts: traces, reports, etc. (default: webspec-artifacts). */
  readonly artifactsDir?: string;

  /** Screenshot capture mode (default: only-on-failure). */
  readonly screenshot?: ScreenshotMode;
  /** Trace capture mode (default: off). */
  readonly trace?: TraceMode;

  /** Reporters to activate (default: ["console"]). */
  readonly reporters?: readonly ReporterType[];

  /** Environment variable defaults (lowest precedence). */
  readonly env?: Readonly<Record<string, string>>;
}

/** Fully resolved config — all fields present, no optionals. */
export interface ResolvedConfig {
  readonly baseUrl: string;
  readonly browser: BrowserType;
  readonly viewport: ViewportSpec;
  readonly headless: boolean;
  readonly timeout: number;
  readonly retries: number;
  readonly specsDir: string;
  readonly flowsDir: string;
  readonly screenshotsDir: string;
  readonly artifactsDir: string;
  readonly screenshot: ScreenshotMode;
  readonly trace: TraceMode;
  readonly reporters: readonly ReporterType[];
  readonly env: Readonly<Record<string, string>>;
  /** Absolute path to the config file (undefined if not found). */
  readonly configFilePath?: string;
}
