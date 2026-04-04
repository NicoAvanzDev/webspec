/**
 * Assertion command handlers.
 */

import { expect } from '@playwright/test';
import type { Step } from '../../../domain/index';
import type { ExecutionContext } from '../context';
import { resolveLocator, describeSelector } from '../../../application/index';

export async function handleAssertVisible(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'assertVisible' in step ? step.assertVisible : undefined;
  if (params !== undefined) {
    const loc = resolveLocator(ctx.page, params);
    await expect(loc).toBeVisible({ timeout: ctx.timeout });
  }
}

export async function handleAssertNotVisible(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'assertNotVisible' in step ? step.assertNotVisible : undefined;
  if (params !== undefined) {
    const loc = resolveLocator(ctx.page, params);
    await expect(loc).not.toBeVisible({ timeout: ctx.timeout });
  }
}

export async function handleAssertText(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'assertText' in step ? step.assertText : undefined;
  if (params !== undefined && typeof params === 'object') {
    const { expected, ...selector } = params;
    const loc = resolveLocator(ctx.page, selector);
    await expect(loc).toHaveText(expected, { timeout: ctx.timeout });
  }
}

export async function handleAssertContainsText(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'assertContainsText' in step ? step.assertContainsText : undefined;
  if (params !== undefined && typeof params === 'object') {
    const { contains, ...selector } = params;
    const loc = resolveLocator(ctx.page, selector);
    const text = await loc.textContent();
    if (!text?.includes(contains)) {
      throw new Error(`Expected element to contain text "${contains}", but got "${text ?? ''}"`);
    }
  }
}

export async function handleAssertUrl(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'assertUrl' in step ? step.assertUrl : undefined;
  if (typeof params === 'string') {
    await expect(ctx.page).toHaveURL(params, { timeout: ctx.timeout });
  } else if (params !== undefined && typeof params === 'object') {
    if (params.url !== undefined) {
      await expect(ctx.page).toHaveURL(params.url, { timeout: ctx.timeout });
    } else if (params.pattern !== undefined) {
      const regex = new RegExp(params.pattern);
      await expect(ctx.page).toHaveURL(regex, { timeout: ctx.timeout });
    }
  }
}

export async function handleAssertTitle(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = 'assertTitle' in step ? step.assertTitle : undefined;
  if (typeof params === 'string') {
    await expect(ctx.page).toHaveTitle(params, { timeout: ctx.timeout });
  } else if (params !== undefined && typeof params === 'object') {
    if (params.title !== undefined) {
      await expect(ctx.page).toHaveTitle(params.title, { timeout: ctx.timeout });
    } else if (params.contains !== undefined) {
      const title = await ctx.page.title();
      if (!title.includes(params.contains)) {
        throw new Error(`Expected title to contain "${params.contains}", but got "${title}"`);
      }
    }
  }
}

export function describeAssertVisible(step: Step): string {
  const params = 'assertVisible' in step ? step.assertVisible : undefined;
  return `assert visible ${describeSelector(params ?? '')}`;
}

export function describeAssertNotVisible(step: Step): string {
  const params = 'assertNotVisible' in step ? step.assertNotVisible : undefined;
  return `assert not visible ${describeSelector(params ?? '')}`;
}

export function describeAssertText(step: Step): string {
  const params = 'assertText' in step ? step.assertText : undefined;
  if (params !== undefined && typeof params === 'object') {
    const { expected, ...sel } = params;
    return `assert text ${describeSelector(sel)} = "${expected}"`;
  }
  return 'assertText';
}

export function describeAssertContainsText(step: Step): string {
  const params = 'assertContainsText' in step ? step.assertContainsText : undefined;
  if (params !== undefined && typeof params === 'object') {
    const { contains, ...sel } = params;
    return `assert ${describeSelector(sel)} contains "${contains}"`;
  }
  return 'assertContainsText';
}

export function describeAssertUrl(step: Step): string {
  const params = 'assertUrl' in step ? step.assertUrl : undefined;
  if (typeof params === 'string') {
    return `assert url = "${params}"`;
  }
  if (params !== undefined && typeof params === 'object') {
    if (params.url !== undefined) {
      return `assert url = "${params.url}"`;
    }
    if (params.pattern !== undefined) {
      return `assert url matches /${params.pattern}/`;
    }
  }
  return 'assertUrl';
}

export function describeAssertTitle(step: Step): string {
  const params = 'assertTitle' in step ? step.assertTitle : undefined;
  if (typeof params === 'string') {
    return `assert title = "${params}"`;
  }
  if (params !== undefined && typeof params === 'object') {
    if (params.title !== undefined) {
      return `assert title = "${params.title}"`;
    }
    if (params.contains !== undefined) {
      return `assert title contains "${params.contains}"`;
    }
  }
  return 'assertTitle';
}
