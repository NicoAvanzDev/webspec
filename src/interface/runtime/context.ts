/**
 * Runtime execution context.
 *
 * Provides the execution environment for step handlers.
 */

import type { BrowserContext, Page } from "playwright";
import type { ResolvedConfig } from "../../domain/index";

export interface ExecutionContext {
  readonly page: Page;
  readonly context: BrowserContext;
  readonly config: ResolvedConfig;
  readonly env: Readonly<Record<string, string>>;
  readonly specPath: string;
  readonly timeout: number;
  screenshotCounter: number;
}

/**
 * Build a full URL from a path and config.
 */
export function buildUrl(path: string, baseUrl: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (baseUrl === "") {
    return path;
  }
  const prefix = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${cleanPath}`;
}

/**
 * Capture a screenshot and save to the configured directory.
 */
export async function captureScreenshot(
  ctx: ExecutionContext,
  description: string,
  isFailure = false,
): Promise<string | undefined> {
  if (ctx.config.screenshot === "off") {
    return undefined;
  }
  if (ctx.config.screenshot === "only-on-failure" && !isFailure) {
    return undefined;
  }

  ctx.screenshotCounter++;
  const timestamp = Date.now();
  const cleanDescription = description.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = `screenshot-${ctx.screenshotCounter}-${cleanDescription}-${timestamp}.png`;
  const screenshotPath = `${ctx.config.screenshotsDir}/${filename}`;

  await ctx.page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}
