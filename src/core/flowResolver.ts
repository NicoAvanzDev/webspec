/**
 * Flow resolver: recursively load `runFlow` references and
 * inline their steps into the parent spec's step list.
 *
 * Guards against:
 *  - Circular dependencies (throws CircularFlowError)
 *  - Missing files (throws FlowNotFoundError)
 *  - Flow-level env override merging
 */

import * as path from 'path';
import * as fs from 'fs';
import { parseYamlObject } from '../utils/yaml';
import { validateSpecSchema } from '../schema/specSchema';
import { normaliseSteps } from './normalizeSpec';
import { resolveEnv } from './resolveEnv';
import { CircularFlowError, FlowNotFoundError, ValidationError } from '../utils/errors';
import type { Step, RunFlowStep } from '../types/spec';

interface ResolveFlowOptions {
  /** Absolute path of the file that contains this runFlow step. */
  parentPath: string;
  /** Env already active at this point. */
  env: Record<string, string>;
  /** Set of absolute paths already in the call stack (circular check). */
  visitedPaths?: Set<string>;
}

/**
 * Resolve all `runFlow` steps in a step list, recursively inlining
 * the referenced flow's steps.
 *
 * Returns a flat, fully-resolved step list.
 */
export async function resolveFlows(
  steps: Step[],
  options: ResolveFlowOptions,
): Promise<Step[]> {
  const visited = options.visitedPaths ?? new Set<string>();
  const resolved: Step[] = [];

  for (const step of steps) {
    if (!isRunFlowStep(step)) {
      resolved.push(step);
      continue;
    }

    const raw = step.runFlow;
    const flowRef = typeof raw === 'string' ? { path: raw, env: {} } : raw;
    const flowEnv = { ...options.env, ...(flowRef.env ?? {}) };

    // Resolve the flow file path relative to the parent spec/flow
    const parentDir = path.dirname(options.parentPath);
    const flowAbsPath = path.resolve(parentDir, flowRef.path);

    // Circular dependency guard
    if (visited.has(flowAbsPath)) {
      throw new CircularFlowError([...visited, flowAbsPath]);
    }

    // File existence check
    if (!fs.existsSync(flowAbsPath)) {
      throw new FlowNotFoundError(flowAbsPath);
    }

    // Parse and validate the flow file
    const raw2 = fs.readFileSync(flowAbsPath, 'utf-8');
    const obj = parseYamlObject(raw2, flowAbsPath);
    const result = validateSpecSchema(obj, flowAbsPath);
    if (!result.success) {
      throw new ValidationError(`Flow validation failed: ${flowAbsPath}`, result.errors);
    }

    // Resolve env in flow steps
    const flowSteps = normaliseSteps(result.data.steps as Step[]);
    const envResolved = resolveEnv(flowSteps, flowEnv) as Step[];

    // Recurse with updated visited set
    const newVisited = new Set([...visited, flowAbsPath]);
    const inlined = await resolveFlows(envResolved, {
      parentPath: flowAbsPath,
      env: flowEnv,
      visitedPaths: newVisited,
    });

    resolved.push(...inlined);
  }

  return resolved;
}

function isRunFlowStep(step: Step): step is RunFlowStep {
  return 'runFlow' in step;
}
