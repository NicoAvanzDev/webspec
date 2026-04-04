/**
 * Domain layer exports.
 *
 * The domain layer contains:
 * - Types: Core type definitions for specs, config, and results
 * - Errors: Domain-specific error classes
 * - Values: Value objects and domain primitives
 */

// Types
export type {
  // Spec types
  SpecFile,
  Step,
  NormalisedStep,
  SelectorSpec,
  BrowserType,
  ViewportSpec,
  NavigateParams,
  NavigateStep,
  ReloadStep,
  GoBackStep,
  GoForwardStep,
  ClickStep,
  DoubleClickStep,
  HoverStep,
  FocusStep,
  FillParams,
  FillStep,
  TypeParams,
  TypeStep,
  SelectParams,
  SelectStep,
  CheckStep,
  UncheckStep,
  UploadParams,
  UploadStep,
  PressKeyParams,
  PressKeyStep,
  ScrollParams,
  ScrollStep,
  DragAndDropParams,
  DragAndDropStep,
  AssertVisibleStep,
  AssertNotVisibleStep,
  AssertTextParams,
  AssertTextStep,
  AssertContainsTextParams,
  AssertContainsTextStep,
  AssertValueParams,
  AssertValueStep,
  AssertUrlParams,
  AssertUrlStep,
  AssertTitleParams,
  AssertTitleStep,
  AssertEnabledStep,
  AssertDisabledStep,
  AssertCheckedStep,
  AssertUncheckedStep,
  AssertCountParams,
  AssertCountStep,
  AssertAttributeParams,
  AssertAttributeStep,
  AssertCssPropertyParams,
  AssertCssPropertyStep,
  WaitForElementStep,
  WaitForUrlParams,
  WaitForUrlStep,
  WaitForNetworkIdleStep,
  PauseStep,
  ScreenshotParams,
  ScreenshotStep,
  LogStep,
  RunFlowParams,
  RunFlowStep,
  EvaluateParams,
  EvaluateStep,
} from "./types/spec";

export type {
  // Config types
  WebSpecConfig,
  ResolvedConfig,
  ScreenshotMode,
  TraceMode,
  ReporterType,
} from "./types/config";

export type {
  // Result types
  StepResult,
  SpecResult,
  RunSummary,
  StepStatus,
  SpecStatus,
} from "./types/results";

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
} from "./errors";
