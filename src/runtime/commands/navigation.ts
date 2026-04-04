/**
 * Navigation command handlers:
 *   navigate, reload, goBack, goForward
 */

import type { ExecutionContext } from '../context';
import { buildUrl } from '../context';
import type { NavigateStep, ReloadStep, GoBackStep, GoForwardStep } from '../../types/spec';

export async function handleNavigate(
  step: NavigateStep,
  ctx: ExecutionContext,
): Promise<void> {
  const raw = step.navigate;
  const params = typeof raw === 'string' ? { url: raw } : raw;
  const url = buildUrl(params.url, ctx.config.baseUrl);
  await ctx.page.goto(url, {
    waitUntil: params.waitUntil ?? 'load',
    timeout: params.timeout ?? ctx.timeout,
  });
}

export async function handleReload(
  step: ReloadStep,
  ctx: ExecutionContext,
): Promise<void> {
  await ctx.page.reload({
    waitUntil: step.reload?.waitUntil ?? 'load',
    timeout: step.reload?.timeout ?? ctx.timeout,
  });
}

export async function handleGoBack(
  step: GoBackStep,
  ctx: ExecutionContext,
): Promise<void> {
  await ctx.page.goBack({
    timeout: step.goBack?.timeout ?? ctx.timeout,
  });
}

export async function handleGoForward(
  step: GoForwardStep,
  ctx: ExecutionContext,
): Promise<void> {
  await ctx.page.goForward({
    timeout: step.goForward?.timeout ?? ctx.timeout,
  });
}

export function describeNavigate(step: NavigateStep): string {
  const raw = step.navigate;
  return `navigate → ${typeof raw === 'string' ? raw : raw.url}`;
}

export function describeReload(_step: ReloadStep): string {
  return 'reload page';
}

export function describeGoBack(_step: GoBackStep): string {
  return 'go back';
}

export function describeGoForward(_step: GoForwardStep): string {
  return 'go forward';
}
