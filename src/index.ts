/**
 * WebSpec public API.
 *
 * Programmatic usage:
 *   import { runSpec, parseSpec, validateSpecSchema } from 'webspec';
 */

// Runtime
export { runSpec, runMany } from './runtime/runner';

// Core
export { parseSpec, parseSpecFromString } from './core/parseSpec';
export { normaliseSteps } from './core/normalizeSpec';
export { resolveEnv, resolveEnvString } from './core/resolveEnv';
export { resolveLocator, describeSelector } from './core/resolveSelectors';
export { resolveFlows } from './core/flowResolver';

// Config
export { loadConfig } from './config/loadConfig';
export { resolveConfig } from './config/resolveConfig';
export { buildDefaults } from './config/defaults';

// Schema
export { validateSpecSchema, SpecFileSchema } from './schema/specSchema';
export { validateConfigSchema, ConfigSchema } from './schema/configSchema';

// Agent
export { classifyIntent, extractBaseUrl, buildMobileRefusal } from './agent/intent';
export { buildApplyCommand, buildRunCommand, buildProposal } from './agent/contracts';

// Errors
export {
  WebSpecError,
  ValidationError,
  StepError,
  CircularFlowError,
  FlowNotFoundError,
  MobileNotSupportedError,
  ConfigError,
  formatError,
} from './utils/errors';

// Types
export type { SpecFile, Step, SelectorSpec, BrowserType, ViewportSpec } from './types/spec';
export type { WebSpecConfig, ResolvedConfig } from './types/config';
export type { RunSummary, SpecResult, StepResult } from './types/results';
