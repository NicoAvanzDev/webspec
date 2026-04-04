/**
 * Environment variable resolution service.
 *
 * Resolves ${VAR} and ${VAR:-default} patterns in step values.
 */

import type { Step, NormalisedStep } from '../../domain/index';

/**
 * Resolve environment variables in a string value.
 * Supports ${VAR} and ${VAR:-default} syntax.
 */
export function resolveEnvString(value: string, env: Readonly<Record<string, string>>): string {
  // Match ${VAR} or ${VAR:-default}
  const pattern = /\$\{([^}]+)\}/g;

  return value.replace(pattern, (match: string, inner: string) => {
    const colonIndex = inner.indexOf(':-');

    if (colonIndex !== -1) {
      const varName = inner.slice(0, colonIndex);
      const defaultValue = inner.slice(colonIndex + 2);
      return env[varName] ?? defaultValue ?? match;
    }

    return env[inner] ?? match;
  });
}

/**
 * Recursively resolve environment variables in step objects.
 */
export function resolveEnv(
  steps: readonly Step[],
  env: Readonly<Record<string, string>>,
): NormalisedStep[] {
  return steps.map((step) => resolveStepEnv(step, env));
}

function resolveStepEnv(step: Step, env: Readonly<Record<string, string>>): NormalisedStep {
  const entries = Object.entries(step);
  const resolvedEntries = entries.map(([key, value]) => {
    const resolvedValue = resolveValue(value, env);
    return [key, resolvedValue] as const;
  });
  return Object.fromEntries(resolvedEntries) as NormalisedStep;
}

function resolveValue(value: unknown, env: Readonly<Record<string, string>>): unknown {
  if (typeof value === 'string') {
    return resolveEnvString(value, env);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, env));
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    const resolvedEntries = entries.map(([k, v]) => [k, resolveValue(v, env)] as const);
    return Object.fromEntries(resolvedEntries);
  }

  return value;
}
