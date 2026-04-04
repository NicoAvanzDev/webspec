/**
 * Resolve ${VAR} and ${VAR:-default} placeholders in spec string values.
 *
 * Supported syntax:
 *   ${VAR}           — required; throws if VAR is unset and no default
 *   ${VAR:-default}  — optional; uses "default" if VAR is unset or empty
 */

import { WebSpecError } from '../utils/errors';

const PLACEHOLDER_RE = /\$\{([^}]+)\}/g;

/**
 * Resolve all ${VAR} placeholders in `input` using `env`.
 */
export function resolveEnvString(input: string, env: Record<string, string>): string {
  return input.replace(PLACEHOLDER_RE, (match, expr: string) => {
    const defaultSep = expr.indexOf(':-');
    if (defaultSep !== -1) {
      const varName = expr.slice(0, defaultSep);
      const defaultValue = expr.slice(defaultSep + 2);
      return env[varName] ?? process.env[varName] ?? defaultValue;
    }
    const value = env[expr] ?? process.env[expr];
    if (value === undefined || value === '') {
      throw new WebSpecError(
        `Environment variable "${expr}" is not set and has no default. ` +
          `Set it in your shell, in spec.env, or use \${${expr}:-default} syntax.`,
      );
    }
    return value;
  });
}

/**
 * Recursively resolve all ${VAR} placeholders in an object/array/string.
 * Numbers, booleans, and nulls are returned as-is.
 */
export function resolveEnv(value: unknown, env: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return resolveEnvString(value, env);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveEnv(item, env));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = resolveEnv(v, env);
    }
    return result;
  }
  return value;
}
