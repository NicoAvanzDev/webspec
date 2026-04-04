/**
 * Resolve a SelectorSpec to a Playwright Locator.
 *
 * Priority order (best to worst):
 *   1. text      → page.getByText()
 *   2. role      → page.getByRole()
 *   3. testid    → page.getByTestId()
 *   4. label     → page.getByLabel()
 *   5. placeholder → page.getByPlaceholder()
 *   6. css       → page.locator()
 *   7. xpath     → page.locator('xpath=...')
 */

import type { Locator, Page } from 'playwright';
import type { SelectorSpec } from '../types/spec';
import { WebSpecError } from '../utils/errors';

/**
 * Build a Playwright Locator from an inline SelectorSpec.
 */
export function resolveLocator(page: Page, selector: SelectorSpec | string): Locator {
  if (typeof selector === 'string') {
    // Bare string → text match
    return page.getByText(selector, { exact: false });
  }

  let base: Locator;

  if (selector.text !== undefined) {
    base = page.getByText(selector.text, { exact: selector.exact ?? false });
  } else if (selector.role !== undefined) {
    const roleOpts: Parameters<Page['getByRole']>[1] = {};
    if (selector.name !== undefined) roleOpts.name = selector.name;
    if (selector.exact !== undefined) roleOpts.exact = selector.exact;
    base = page.getByRole(selector.role as Parameters<Page['getByRole']>[0], roleOpts);
  } else if (selector.testid !== undefined) {
    base = page.getByTestId(selector.testid);
  } else if (selector.label !== undefined) {
    const labelOpts: Parameters<Page['getByLabel']>[1] = {};
    if (selector.exact !== undefined) labelOpts.exact = selector.exact;
    base = page.getByLabel(selector.label, labelOpts);
  } else if (selector.placeholder !== undefined) {
    const phOpts: Parameters<Page['getByPlaceholder']>[1] = {};
    if (selector.exact !== undefined) phOpts.exact = selector.exact;
    base = page.getByPlaceholder(selector.placeholder, phOpts);
  } else if (selector.css !== undefined) {
    base = page.locator(selector.css);
  } else if (selector.xpath !== undefined) {
    base = page.locator(`xpath=${selector.xpath}`);
  } else {
    throw new WebSpecError(
      'No valid selector field found. Provide one of: text, role, testid, label, placeholder, css, xpath',
    );
  }

  if (selector.nth !== undefined) {
    return base.nth(selector.nth);
  }

  return base;
}

/**
 * Return a human-readable description of a selector (for logging).
 */
export function describeSelector(selector: SelectorSpec | string): string {
  if (typeof selector === 'string') return `text="${selector}"`;
  if (selector.text)        return `text="${selector.text}"`;
  if (selector.role)        return `role=${selector.role}${selector.name ? `[name="${selector.name}"]` : ''}`;
  if (selector.testid)      return `testid="${selector.testid}"`;
  if (selector.label)       return `label="${selector.label}"`;
  if (selector.placeholder) return `placeholder="${selector.placeholder}"`;
  if (selector.css)         return `css="${selector.css}"`;
  if (selector.xpath)       return `xpath="${selector.xpath}"`;
  return '<unknown selector>';
}
