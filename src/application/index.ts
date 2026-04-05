/**
 * Application layer exports.
 *
 * The application layer contains:
 * - Services: Use cases and business logic
 * - Ports: Interfaces for infrastructure adapters
 */

// Services
export { parseSpec, parseSpecFromString } from "./services/spec-parser";
export { resolveEnv, resolveEnvString } from "./services/env-resolver";
export { normaliseSteps, extractSelector } from "./services/normalizer";
export { resolveFlows } from "./services/flow-resolver";
export { resolveLocator, describeSelector } from "./services/selector-resolver";
export { runSpec, runMany } from "./services/runner";
export type { FlowResolutionOptions } from "./services/flow-resolver";
export type { RunOptions, RunSpecOptions, RunManyOptions } from "./services/runner";
