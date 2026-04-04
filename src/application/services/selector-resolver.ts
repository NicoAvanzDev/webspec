/**
 * Selector resolution service.
 *
 * Converts WebSpec selector specs to Playwright locators.
 */

import type { Page, Locator } from 'playwright';
import type { SelectorSpec } from '../../domain/index';

/**
 * Resolve a WebSpec selector to a Playwright locator.
 */
export function resolveLocator(page: Page, selector: string | SelectorSpec): Locator {
  if (typeof selector === 'string') {
    return page.getByText(selector, { exact: false });
  }

  // Priority order: text > role > testid > label > placeholder > css > xpath
  if (selector.text !== undefined) {
    return page.getByText(selector.text, { exact: selector.exact ?? false });
  }

  if (selector.role !== undefined) {
    const options = selector.name !== undefined ? { name: selector.name } : undefined;
    return page.getByRole(selector.role as Parameters<Page['getByRole']>[0], options);
  }

  if (selector.testid !== undefined) {
    return page.getByTestId(selector.testid);
  }

  if (selector.label !== undefined) {
    return page.getByLabel(selector.label, { exact: selector.exact ?? false });
  }

  if (selector.placeholder !== undefined) {
    return page.getByPlaceholder(selector.placeholder, { exact: selector.exact ?? false });
  }

  if (selector.css !== undefined) {
    const base = page.locator(selector.css);
    return applyNth(base, selector.nth);
  }

  if (selector.xpath !== undefined) {
    const base = page.locator(`xpath=${selector.xpath}`);
    return applyNth(base, selector.nth);
  }

  // Fallback: return body locator if no selector specified
  return page.locator('body');
}

function applyNth(locator: Locator, nth: number | undefined): Locator {
  if (nth === undefined) {
    return locator;
  }
  return locator.nth(nth);
}

/**
 * Generate a human-readable description of a selector.
 */
export function describeSelector(selector: string | SelectorSpec): string {
  if (typeof selector === 'string') {
    return `"${selector}"`;
  }

  if (selector.text !== undefined) {
    return `text="${selector.text}"${selector.exact ? ' (exact)' : ''}`;
  }

  if (selector.role !== undefined) {
    const name = selector.name !== undefined ? ` name="${selector.name}"` : '';
    return `role=${selector.role}${name}`;
  }

  if (selector.testid !== undefined) {
    return `testid="${selector.testid}"`;
  }

  if (selector.label !== undefined) {
    return `label="${selector.label}"${selector.exact ? ' (exact)' : ''}`;
  }

  if (selector.placeholder !== undefined) {
    return `placeholder="${selector.placeholder}"${selector.exact ? ' (exact)' : ''}`;
  }

  if (selector.css !== undefined) {
    const nth = selector.nth !== undefined ? `[${selector.nth}]` : '';
    return `css=${selector.css}${nth}`;
  }

  if (selector.xpath !== undefined) {
    const nth = selector.nth !== undefined ? `[${selector.nth}]` : '';
    return `xpath=${selector.xpath}${nth}`;
  }

  return '[unknown]';
}
