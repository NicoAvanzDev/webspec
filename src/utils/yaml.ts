/**
 * YAML parse/stringify utilities for WebSpec.
 * Wraps js-yaml with sensible defaults and error formatting.
 */

import * as yaml from 'js-yaml';
import { WebSpecError } from './errors';

/**
 * Parse YAML string → plain JS object.
 * Throws WebSpecError with a clear message on invalid YAML.
 */
export function parseYaml(content: string, sourcePath?: string): unknown {
  try {
    return yaml.load(content);
  } catch (err) {
    const msg =
      err instanceof yaml.YAMLException
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    const location = sourcePath ? ` (${sourcePath})` : '';
    throw new WebSpecError(`Invalid YAML${location}: ${msg}`);
  }
}

/**
 * Stringify JS object → YAML string.
 */
export function stringifyYaml(data: unknown): string {
  return yaml.dump(data, {
    indent: 2,
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  });
}

/**
 * Parse YAML and ensure the result is a plain object (not array/null).
 */
export function parseYamlObject(content: string, sourcePath?: string): Record<string, unknown> {
  const parsed = parseYaml(content, sourcePath);
  if (parsed === null || parsed === undefined) {
    const location = sourcePath ? ` (${sourcePath})` : '';
    throw new WebSpecError(`Empty YAML document${location}`);
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    const location = sourcePath ? ` (${sourcePath})` : '';
    throw new WebSpecError(`Expected a YAML mapping (object)${location}, got ${typeof parsed}`);
  }
  return parsed as Record<string, unknown>;
}
