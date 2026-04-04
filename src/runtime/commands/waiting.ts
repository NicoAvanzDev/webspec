/**
 * Wait command handlers:
 *   waitForElement, waitForUrl, waitForNetworkIdle
 */

import { expect } from '@playwright/test';
import type { ExecutionContext } from '../context';
import { resolveLocator, describeSelector } from '../../core/resolveSelectors';
import type {
  WaitForElementStep,
  WaitForUrlStep,
  WaitForNetworkIdleStep,
} from '../../types/spec';

export async function handleWaitForElement(
  step: WaitForElementStep,
  ctx: ExecutionContext,
): Promise<void> {
  const loc = resolveLocator(ctx.page, step.waitForElement);
  await expect(loc).toBeVisible({ timeout: ctx.timeout });
}

export async function handleWaitForUrl(
  step: WaitForUrlStep,
  ctx: ExecutionContext,
): Promise<void> {
  const raw = step.waitForUrl;
  const url = typeof raw === 'string' ? raw : raw.url;
  const timeout = (typeof raw === 'object' ? raw.timeout : undefined) ?? ctx.timeout;
  await ctx.page.waitForURL(url, { timeout });
}

export async function handleWaitForNetworkIdle(
  step: WaitForNetworkIdleStep,
  ctx: ExecutionContext,
): Promise<void> {
  const timeout = step.waitForNetworkIdle?.timeout ?? ctx.timeout;
  await ctx.page.waitForLoadState('networkidle', { timeout });
}

export const describeWaitForElement = (s: WaitForElementStep): string =>
  `waitForElement: ${describeSelector(s.waitForElement)}`;
export const describeWaitForUrl = (s: WaitForUrlStep): string => {
  const raw = s.waitForUrl;
  return `waitForUrl: ${typeof raw === 'string' ? raw : raw.url}`;
};
export const describeWaitForNetworkIdle = (_s: WaitForNetworkIdleStep): string =>
  'waitForNetworkIdle';
