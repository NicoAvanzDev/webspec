/**
 * Utility command handlers.
 */

import * as path from "node:path";
import * as fs from "node:fs";
import type { Step } from "../../../domain/index";
import type { ExecutionContext } from "../context";

export async function handleScreenshot(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "screenshot" in step ? step.screenshot : undefined;
  if (params === null || params === undefined) {
    const defaultPath = path.join(ctx.config.screenshotsDir, `screenshot-${Date.now()}.png`);
    fs.mkdirSync(ctx.config.screenshotsDir, { recursive: true });
    await ctx.page.screenshot({ path: defaultPath, fullPage: true });
  } else {
    const screenshotPath = path.join(
      ctx.config.screenshotsDir,
      params.path ?? `screenshot-${Date.now()}.png`,
    );
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await ctx.page.screenshot({ path: screenshotPath, fullPage: params.fullPage ?? false });
  }
}

export async function handleLog(step: Step): Promise<void> {
  const params = "log" in step ? step.log : undefined;
  if (params !== undefined) {
    console.log(`[spec] ${params}`);
  }
}

export function describeScreenshot(step: Step): string {
  const params = "screenshot" in step ? step.screenshot : undefined;
  if (
    params !== undefined &&
    params !== null &&
    typeof params === "object" &&
    params.path !== undefined
  ) {
    return `screenshot → "${params.path}"`;
  }
  return "screenshot";
}

export function describeLog(step: Step): string {
  const params = "log" in step ? step.log : undefined;
  return `log: "${params ?? ""}"`;
}
