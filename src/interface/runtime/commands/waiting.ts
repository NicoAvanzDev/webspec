/**
 * Waiting command handlers.
 */

import { expect } from '@playwright/test';
import type { Step } from '../../../domain/index';
import type { ExecutionContext } from '../context';
import { resolveLocator, describeSelector } from '../../../application/index';

export async function handleWaitForElement(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'waitForElement' in step ? step.waitForElement : undefined;
  if (params !== undefined) {
    const loc = resolveLocator(ctx.page, params);
    await loc.waitFor({ timeout: ctx.timeout });
  }
}

export async function handleWaitForUrl(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'waitForUrl' in step ? step.waitForUrl : undefined;
  if (typeof params === 'string') {
    await expect(ctx.page).toHaveURL(params, { timeout: ctx.timeout });
  } else if (params !== undefined && typeof params === 'object') {
    await expect(ctx.page).toHaveURL(params.url, { timeout: params.timeout ?? ctx.timeout });
  }
}

export async function handleWaitForNetworkIdle(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'waitForNetworkIdle' in step ? step.waitForNetworkIdle : undefined;
  const timeout = params !== null && typeof params === 'object' ? params.timeout : undefined;
  await ctx.page.waitForLoadState('networkidle', { timeout: timeout ?? ctx.timeout });
}

export function describeWaitForElement(step: Step): string {
  const params = 'waitForElement' in step ? step.waitForElement : undefined;
  return `wait for element ${describeSelector(params ?? '')}`;
}

export function describeWaitForUrl(step: Step): string {
  const params = 'waitForUrl' in step ? step.waitForUrl : undefined;
  if (typeof params === 'string') {
    return `wait for url "${params}"`;
  }
  if (params !== undefined && typeof params === 'object') {
    return `wait for url "${params.url}"`;
  }
  return 'waitForUrl';
}

export function describeWaitForNetworkIdle(): string {
  return 'wait for network idle';
}
