/**
 * Flow resolution service.
 *
 * Resolves runFlow references by inlining steps from referenced flow files.
 * Detects circular dependencies.
 */

import * as path from 'node:path';
import type { Step, NormalisedStep } from '../../domain/index';
import { CircularFlowError, FlowNotFoundError, ValidationError } from '../../domain/index';
import { parseSpec } from './spec-parser';

export interface FlowResolutionOptions {
  readonly parentPath: string;
  readonly env: Readonly<Record<string, string>>;
}

/**
 * Resolve all runFlow references in steps by inlining flow steps.
 * Detects and prevents circular dependencies.
 */
export async function resolveFlows(
  steps: readonly Step[],
  options: FlowResolutionOptions,
): Promise<NormalisedStep[]> {
  const resolved: NormalisedStep[] = [];
  const stack: string[] = [];

  await resolveFlowsRecursive(steps, options, resolved, stack);

  return resolved;
}

async function resolveFlowsRecursive(
  steps: readonly Step[],
  options: FlowResolutionOptions,
  resolved: NormalisedStep[],
  stack: string[],
): Promise<void> {
  for (const step of steps) {
    if ('runFlow' in step) {
      const flowRef = step.runFlow;
      const flowPath = typeof flowRef === 'string' ? flowRef : flowRef.path;
      const flowEnv = typeof flowRef === 'string' ? {} : (flowRef.env ?? {});

      const absolutePath = path.resolve(path.dirname(options.parentPath), flowPath);

      // Check for circular dependency
      if (stack.includes(absolutePath)) {
        const cycle = [...stack, absolutePath];
        throw new CircularFlowError(cycle);
      }

      // Parse and inline the flow
      try {
        const flowSpec = parseSpec(absolutePath);

        // Merge env: parent env < flow spec env < inline env
        const mergedEnv = { ...options.env, ...flowSpec.env, ...flowEnv };

        // Recursively resolve the flow
        const newStack = [...stack, absolutePath];
        await resolveFlowsRecursive(
          flowSpec.steps,
          { parentPath: absolutePath, env: mergedEnv },
          resolved,
          newStack,
        );
      } catch (err) {
        if (err instanceof CircularFlowError) {
          throw err;
        }
        if (err instanceof FlowNotFoundError) {
          throw err;
        }
        throw new ValidationError(`Failed to resolve flow: ${flowPath}`, [
          err instanceof Error ? err.message : String(err),
        ]);
      }
    } else {
      resolved.push(step as NormalisedStep);
    }
  }
}
