/**
 * YAML persistence adapter.
 *
 * Wraps js-yaml with domain error handling.
 */

import * as yaml from 'js-yaml';
import { ValidationError } from '../../domain/index';

/**
 * Parse YAML content into a JavaScript value.
 */
export function parseYaml(content: string, sourcePath?: string): unknown {
  try {
    return yaml.load(content, { filename: sourcePath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ValidationError(
      sourcePath ? `Failed to parse YAML: ${sourcePath}` : 'Failed to parse YAML',
      [message],
    );
  }
}

/**
 * Stringify a JavaScript value to YAML.
 */
export function stringifyYaml(data: unknown): string {
  return yaml.dump(data, {
    indent: 2,
    lineWidth: 100,
    noRefs: true,
    sortKeys: true,
  });
}

/**
 * Parse YAML and assert it's an object.
 */
export function parseYamlObject(content: string, sourcePath?: string): Record<string, unknown> {
  const parsed = parseYaml(content, sourcePath);

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError(
      sourcePath ? `Invalid YAML structure: ${sourcePath}` : 'Invalid YAML structure',
      ['Expected YAML object, got array or primitive'],
    );
  }

  return parsed as Record<string, unknown>;
}
