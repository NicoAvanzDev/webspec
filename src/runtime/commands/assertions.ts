/**
 * Assertion command handlers — all use Playwright's expect() for auto-retry.
 *
 *   assertVisible, assertNotVisible, assertText, assertContainsText,
 *   assertValue, assertUrl, assertTitle, assertEnabled, assertDisabled,
 *   assertChecked, assertUnchecked, assertCount, assertAttribute,
 *   assertCssProperty
 */

import { expect } from '@playwright/test';
import type { ExecutionContext } from '../context';
import { resolveLocator, describeSelector } from '../../core/resolveSelectors';
import type {
  AssertVisibleStep,
  AssertNotVisibleStep,
  AssertTextStep,
  AssertContainsTextStep,
  AssertValueStep,
  AssertUrlStep,
  AssertTitleStep,
  AssertEnabledStep,
  AssertDisabledStep,
  AssertCheckedStep,
  AssertUncheckedStep,
  AssertCountStep,
  AssertAttributeStep,
  AssertCssPropertyStep,
} from '../../types/spec';

export async function handleAssertVisible(
  step: AssertVisibleStep,
  ctx: ExecutionContext,
): Promise<void> {
  const loc = resolveLocator(ctx.page, step.assertVisible);
  await expect(loc).toBeVisible({ timeout: ctx.timeout });
}

export async function handleAssertNotVisible(
  step: AssertNotVisibleStep,
  ctx: ExecutionContext,
): Promise<void> {
  const loc = resolveLocator(ctx.page, step.assertNotVisible);
  await expect(loc).toBeHidden({ timeout: ctx.timeout });
}

export async function handleAssertText(
  step: AssertTextStep,
  ctx: ExecutionContext,
): Promise<void> {
  const { expected, ...selector } = step.assertText;
  const loc = resolveLocator(ctx.page, selector);
  await expect(loc).toHaveText(expected, {
    timeout: ctx.timeout,
    useInnerText: true,
  });
}

export async function handleAssertContainsText(
  step: AssertContainsTextStep,
  ctx: ExecutionContext,
): Promise<void> {
  const { contains, ...selector } = step.assertContainsText;
  const loc = resolveLocator(ctx.page, selector);
  await expect(loc).toContainText(contains, { timeout: ctx.timeout });
}

export async function handleAssertValue(
  step: AssertValueStep,
  ctx: ExecutionContext,
): Promise<void> {
  const { expected, ...selector } = step.assertValue;
  const loc = resolveLocator(ctx.page, selector);
  await expect(loc).toHaveValue(expected, { timeout: ctx.timeout });
}

export async function handleAssertUrl(
  step: AssertUrlStep,
  ctx: ExecutionContext,
): Promise<void> {
  const raw = step.assertUrl;
  if (typeof raw === 'string') {
    await expect(ctx.page).toHaveURL(raw, { timeout: ctx.timeout });
    return;
  }
  if (raw.pattern) {
    await expect(ctx.page).toHaveURL(new RegExp(raw.pattern), { timeout: ctx.timeout });
  } else if (raw.url) {
    await expect(ctx.page).toHaveURL(raw.url, { timeout: ctx.timeout });
  }
}

export async function handleAssertTitle(
  step: AssertTitleStep,
  ctx: ExecutionContext,
): Promise<void> {
  const raw = step.assertTitle;
  if (typeof raw === 'string') {
    await expect(ctx.page).toHaveTitle(raw, { timeout: ctx.timeout });
    return;
  }
  if (raw.title) {
    await expect(ctx.page).toHaveTitle(raw.title, { timeout: ctx.timeout });
  } else if (raw.contains) {
    await expect(ctx.page).toHaveTitle(new RegExp(raw.contains), { timeout: ctx.timeout });
  }
}

export async function handleAssertEnabled(
  step: AssertEnabledStep,
  ctx: ExecutionContext,
): Promise<void> {
  const loc = resolveLocator(ctx.page, step.assertEnabled);
  await expect(loc).toBeEnabled({ timeout: ctx.timeout });
}

export async function handleAssertDisabled(
  step: AssertDisabledStep,
  ctx: ExecutionContext,
): Promise<void> {
  const loc = resolveLocator(ctx.page, step.assertDisabled);
  await expect(loc).toBeDisabled({ timeout: ctx.timeout });
}

export async function handleAssertChecked(
  step: AssertCheckedStep,
  ctx: ExecutionContext,
): Promise<void> {
  const loc = resolveLocator(ctx.page, step.assertChecked);
  await expect(loc).toBeChecked({ timeout: ctx.timeout });
}

export async function handleAssertUnchecked(
  step: AssertUncheckedStep,
  ctx: ExecutionContext,
): Promise<void> {
  const loc = resolveLocator(ctx.page, step.assertUnchecked);
  await expect(loc).not.toBeChecked({ timeout: ctx.timeout });
}

export async function handleAssertCount(
  step: AssertCountStep,
  ctx: ExecutionContext,
): Promise<void> {
  const { count, ...selector } = step.assertCount;
  const loc = resolveLocator(ctx.page, selector);
  await expect(loc).toHaveCount(count, { timeout: ctx.timeout });
}

export async function handleAssertAttribute(
  step: AssertAttributeStep,
  ctx: ExecutionContext,
): Promise<void> {
  const { attribute, expected, ...selector } = step.assertAttribute;
  const loc = resolveLocator(ctx.page, selector);
  await expect(loc).toHaveAttribute(attribute, expected, { timeout: ctx.timeout });
}

export async function handleAssertCssProperty(
  step: AssertCssPropertyStep,
  ctx: ExecutionContext,
): Promise<void> {
  const { property, expected, ...selector } = step.assertCssProperty;
  const loc = resolveLocator(ctx.page, selector);
  await expect(loc).toHaveCSS(property, expected, { timeout: ctx.timeout });
}

// ---------------------------------------------------------------------------
// Describe helpers
// ---------------------------------------------------------------------------

export const describeAssertVisible = (s: AssertVisibleStep): string =>
  `assertVisible: ${describeSelector(s.assertVisible)}`;
export const describeAssertNotVisible = (s: AssertNotVisibleStep): string =>
  `assertNotVisible: ${describeSelector(s.assertNotVisible)}`;
export const describeAssertText = (s: AssertTextStep): string => {
  const { expected, ...sel } = s.assertText;
  return `assertText: ${describeSelector(sel)} = "${expected}"`;
};
export const describeAssertContainsText = (s: AssertContainsTextStep): string => {
  const { contains, ...sel } = s.assertContainsText;
  return `assertContainsText: ${describeSelector(sel)} ∋ "${contains}"`;
};
export const describeAssertValue = (s: AssertValueStep): string => {
  const { expected, ...sel } = s.assertValue;
  return `assertValue: ${describeSelector(sel)} = "${expected}"`;
};
export const describeAssertUrl = (s: AssertUrlStep): string => {
  const raw = s.assertUrl;
  return `assertUrl: ${typeof raw === 'string' ? raw : raw.pattern ?? raw.url ?? '?'}`;
};
export const describeAssertTitle = (s: AssertTitleStep): string => {
  const raw = s.assertTitle;
  if (typeof raw === 'string') return `assertTitle: "${raw}"`;
  return `assertTitle: "${raw.title ?? raw.contains ?? '?'}"`;
};
export const describeAssertEnabled = (s: AssertEnabledStep): string =>
  `assertEnabled: ${describeSelector(s.assertEnabled)}`;
export const describeAssertDisabled = (s: AssertDisabledStep): string =>
  `assertDisabled: ${describeSelector(s.assertDisabled)}`;
export const describeAssertChecked = (s: AssertCheckedStep): string =>
  `assertChecked: ${describeSelector(s.assertChecked)}`;
export const describeAssertUnchecked = (s: AssertUncheckedStep): string =>
  `assertUnchecked: ${describeSelector(s.assertUnchecked)}`;
export const describeAssertCount = (s: AssertCountStep): string => {
  const { count, ...sel } = s.assertCount;
  return `assertCount: ${describeSelector(sel)} = ${count}`;
};
export const describeAssertAttribute = (s: AssertAttributeStep): string => {
  const { attribute, expected, ...sel } = s.assertAttribute;
  return `assertAttribute: ${describeSelector(sel)}[${attribute}] = "${expected}"`;
};
export const describeAssertCssProperty = (s: AssertCssPropertyStep): string => {
  const { property, expected, ...sel } = s.assertCssProperty;
  return `assertCssProperty: ${describeSelector(sel)} ${property} = "${expected}"`;
};
