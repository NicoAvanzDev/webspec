/**
 * Utility command handlers:
 *   pause, screenshot, log, evaluate
 *
 * runFlow is handled upstream by the flow resolver — it should never
 * reach this command registry at execution time.
 */

import * as path from 'path';
import * as fs from 'fs';
import type { ExecutionContext } from '../context';
import { logger } from '../../utils/logging';
import type { PauseStep, ScreenshotStep, LogStep, EvaluateStep } from '../../types/spec';

export async function handlePause(step: PauseStep, _ctx: ExecutionContext): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, step.pause));
}

export async function handleScreenshot(
  step: ScreenshotStep,
  ctx: ExecutionContext,
): Promise<void> {
  const params = step.screenshot ?? {};
  const { config } = ctx;

  fs.mkdirSync(config.screenshotsDir, { recursive: true });

  const filename = params.path
    ? path.basename(params.path)
    : `manual-${Date.now()}.png`;

  const outputPath = params.path
    ? path.resolve(config.artifactsDir, params.path)
    : path.join(config.screenshotsDir, filename);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await ctx.page.screenshot({
    path: outputPath,
    fullPage: params.fullPage ?? false,
  });

  logger.info(`Screenshot saved: ${outputPath}`);
}

export async function handleLog(step: LogStep, _ctx: ExecutionContext): Promise<void> {
  logger.info(`[spec] ${step.log}`);
}

export async function handleEvaluate(
  step: EvaluateStep,
  ctx: ExecutionContext,
): Promise<void> {
  // Security note: evaluate runs arbitrary JS in the browser context.
  // It is an escape hatch — prefer declarative commands where possible.
  const { script, args = [] } = step.evaluate;
  await ctx.page.evaluate(
    // The script string is wrapped in an async IIFE
    new Function('args', `return (async function() { ${script} })()`).toString(),
    args,
  );
}

export const describePause = (s: PauseStep): string => `pause ${s.pause}ms`;
export const describeScreenshot = (s: ScreenshotStep): string =>
  `screenshot${s.screenshot?.path ? ` → ${s.screenshot.path}` : ''}`;
export const describeLog = (s: LogStep): string => `log: "${s.log}"`;
export const describeEvaluate = (s: EvaluateStep): string =>
  `evaluate: ${s.evaluate.description ?? s.evaluate.script.slice(0, 40)}`;
