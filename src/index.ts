/**
 * Public API exports for WebSpec.
 *
 * This is the main entry point for programmatic usage.
 */

// Domain
export type {
  // Spec types
  SpecFile,
  Step,
  NormalisedStep,
  SelectorSpec,
  BrowserType,
  ViewportSpec,
  // Config types
  WebSpecConfig,
  ResolvedConfig,
  ScreenshotMode,
  TraceMode,
  ReporterType,
  // Result types
  StepResult,
  SpecResult,
  RunSummary,
  StepStatus,
  SpecStatus,
} from "./domain/index";

export {
  // Errors
  WebSpecError,
  ValidationError,
  StepError,
  CircularFlowError,
  FlowNotFoundError,
  MobileNotSupportedError,
  ConfigError,
  formatError,
} from "./domain/index";

// Application
export {
  parseSpec,
  parseSpecFromString,
  resolveEnv,
  resolveEnvString,
  normaliseSteps,
  extractSelector,
  resolveFlows,
  resolveLocator,
  describeSelector,
} from "./application/index";

export type { FlowResolutionOptions } from "./application/index";

// Infrastructure
export {
  parseYaml,
  stringifyYaml,
  parseYamlObject,
  readFile,
  writeFile,
  ensureDir,
  exists,
  isDirectory,
  isFile,
  loadConfig,
  resolveConfig,
} from "./infrastructure/index";

// Interface
export type { ExecutionContext, CommandEntry, Reporter } from "./interface/index";
export {
  buildUrl,
  captureScreenshot,
  COMMAND_REGISTRY,
  getCommandKey,
  getSupportedCommands,
  ConsoleReporter,
  JsonReporter,
  MultiReporter,
} from "./interface/index";
