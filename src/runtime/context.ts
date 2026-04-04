/**
 * Execution context passed to every command handler.
 * Contains runtime state, config, and helpers.
 */

import * as path from 'path';
import * as fs from 'fs';
import type { Page, BrowserContext } from 'playwright';
import type { ResolvedConfig } from '../types/config';
import { logger } from '../utils/logging';

export interface ExecutionContext {
  /** Playwright page instance. */
  page: Page;
  /** Playwright browser context. */
  context: BrowserContext;
  /** Fully resolved configuration. */
  config: ResolvedConfig;
  /** Merged environment variables for this run. */
  env: Record<string, string>;
  /** Absolute path of the spec being run. */
  specPath: string;
  /** Step-level timeout override (ms). */
  timeout: number;
  /** Counter for auto-named screenshots. */
  screenshotCounter: number;
}

/**
 * Take a screenshot and save it to the artifacts directory.
 * Returns the absolute path of the saved screenshot.
 */
export async function captureScreenshot(
  ctx: ExecutionContext,
  stepDescription: string,
  explicit = false,
): Promise<string | undefined> {
  const { config, page } = ctx;

  const shouldCapture =
    config.screenshot === 'on' ||
    (explicit) ||
    config.screenshot === 'only-on-failure'; // caller decides when it's a failure

  if (!shouldCapture) return undefined;

  fs.mkdirSync(config.screenshotsDir, { recursive: true });

  const idx = String(ctx.screenshotCounter++).padStart(3, '0');
  const safe = stepDescription.replace(/[^a-z0-9-]/gi, '-').slice(0, 40);
  const filename = `${idx}-${safe}.png`;
  const screenshotPath = path.join(config.screenshotsDir, filename);

  try {
    await page.screenshot({ path: screenshotPath, fullPage: false });
    return screenshotPath;
  } catch (err) {
    logger.warn(`Could not capture screenshot: ${(err as Error).message}`);
    return undefined;
  }
}

/**
 * Build the full URL for a navigation target.
 * Relative paths are joined with baseUrl.
 */
export function buildUrl(target: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(target)) return target;
  if (!baseUrl) return target;
  return baseUrl.replace(/\/$/, '') + (target.startsWith('/') ? target : `/${target}`);
}
