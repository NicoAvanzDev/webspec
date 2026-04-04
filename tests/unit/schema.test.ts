/**
 * Unit tests for spec schema validation.
 */

import { describe, it, expect } from 'vitest';
import { validateSpecSchema } from '../../src/schema/specSchema';

const VALID_MINIMAL = {
  name: 'test spec',
  steps: [{ navigate: '/path' }],
};

const VALID_FULL = {
  name: 'full spec',
  description: 'A full spec',
  baseUrl: 'https://example.com',
  browser: 'chromium',
  viewport: { width: 1280, height: 720 },
  headless: true,
  timeout: 10000,
  retries: 1,
  tags: ['smoke'],
  env: { KEY: 'value' },
  steps: [
    { navigate: '/path' },
    { click: 'Button Text' },
    { assertVisible: 'Some text' },
    { fill: { label: 'Email', value: 'test@test.com' } },
    { assertUrl: '/dashboard' },
  ],
};

describe('validateSpecSchema', () => {
  it('accepts a minimal valid spec', () => {
    const result = validateSpecSchema(VALID_MINIMAL);
    expect(result.success).toBe(true);
  });

  it('accepts a full valid spec', () => {
    const result = validateSpecSchema(VALID_FULL);
    expect(result.success).toBe(true);
  });

  it('rejects a spec with no name', () => {
    const result = validateSpecSchema({ steps: [{ navigate: '/' }] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    }
  });

  it('rejects a spec with no steps', () => {
    const result = validateSpecSchema({ name: 'test', steps: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('step'))).toBe(true);
    }
  });

  it('rejects an invalid browser value', () => {
    const result = validateSpecSchema({
      name: 'test',
      browser: 'safari',
      steps: [{ navigate: '/' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts click with string shorthand', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ click: 'Button' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts click with selector object', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ click: { role: 'button', name: 'Submit' } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts fill with inline selector and value', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ fill: { label: 'Email', value: 'a@b.com' } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts assertText with selector + expected', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ assertText: { css: 'h1', expected: 'Hello' } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts runFlow shorthand', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ runFlow: './flows/login.yaml' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts runFlow with env overrides', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ runFlow: { path: './flows/login.yaml', env: { EMAIL: 'a@b.com' } } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts pressKey shorthand', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ pressKey: 'Enter' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts waitForNetworkIdle without params', () => {
    const result = validateSpecSchema({
      name: 'test',
      steps: [{ waitForNetworkIdle: null }],
    });
    expect(result.success).toBe(true);
  });
});
