/**
 * Core TypeScript types for WebSpec spec files (.spec.yaml).
 *
 * Design philosophy:
 *  - Selector fields are "inlined" into the command object for readability.
 *  - Most commands accept a string shorthand (text match) OR an explicit object.
 *  - Assertion commands that need both a selector AND an expected value use
 *    inlined selectors alongside named assertion fields.
 *
 * Selector priority (best to worst):
 *  1. text   → getByText()
 *  2. role   → getByRole()
 *  3. testid → getByTestId()
 *  4. label  → getByLabel()
 *  5. placeholder → getByPlaceholder()
 *  6. css    → locator()
 *  7. xpath  → locator('xpath=...')
 */

// ---------------------------------------------------------------------------
// Selector specification
// ---------------------------------------------------------------------------

/**
 * Inline selector fields — mixed directly into a command object.
 * Exactly one "primary" selector field should be present.
 */
export interface SelectorSpec {
  /** Match by visible text content. */
  text?: string;
  /** Match by ARIA role (e.g. "button", "heading", "link"). */
  role?: string;
  /** Accessible name when using `role`. */
  name?: string;
  /** Match by data-testid attribute. */
  testid?: string;
  /** Match by associated label text. */
  label?: string;
  /** Match by placeholder attribute. */
  placeholder?: string;
  /** CSS selector. */
  css?: string;
  /** XPath expression (use as last resort). */
  xpath?: string;
  /** Require exact text/label match (default: false). */
  exact?: boolean;
  /** Select the nth match (0-based). Use sparingly. */
  nth?: number;
}

// ---------------------------------------------------------------------------
// Browser / viewport
// ---------------------------------------------------------------------------

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface ViewportSpec {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Navigation commands
// ---------------------------------------------------------------------------

export interface NavigateParams {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  timeout?: number;
}

export interface NavigateStep {
  navigate: string | NavigateParams;
}

export interface ReloadStep {
  reload?: { waitUntil?: NavigateParams['waitUntil']; timeout?: number } | null;
}

export interface GoBackStep {
  goBack?: { timeout?: number } | null;
}

export interface GoForwardStep {
  goForward?: { timeout?: number } | null;
}

// ---------------------------------------------------------------------------
// Interaction commands
// ---------------------------------------------------------------------------

export interface ClickStep {
  click: string | SelectorSpec;
}

export interface DoubleClickStep {
  doubleClick: string | SelectorSpec;
}

export interface HoverStep {
  hover: string | SelectorSpec;
}

export interface FocusStep {
  focus: string | SelectorSpec;
}

export interface FillParams extends SelectorSpec {
  /** Value to fill into the input. */
  value: string;
  /** Clear the field before typing (default: true). */
  clear?: boolean;
}

export interface FillStep {
  fill: FillParams;
}

export interface TypeParams extends SelectorSpec {
  /** Text to type character-by-character. */
  value: string;
  /** Delay between keystrokes in ms. */
  delay?: number;
}

export interface TypeStep {
  type: TypeParams;
}

export interface SelectParams extends SelectorSpec {
  /** Option value(s) to select. */
  value: string | string[];
}

export interface SelectStep {
  select: SelectParams;
}

export interface CheckStep {
  check: string | SelectorSpec;
}

export interface UncheckStep {
  uncheck: string | SelectorSpec;
}

export interface UploadParams extends SelectorSpec {
  /** File path(s) relative to cwd. */
  file: string | string[];
}

export interface UploadStep {
  upload: UploadParams;
}

export interface PressKeyParams extends Partial<SelectorSpec> {
  /** Key or key combo, e.g. "Enter", "Control+A", "Escape". */
  key: string;
}

export interface PressKeyStep {
  pressKey: string | PressKeyParams;
}

export interface ScrollParams {
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Pixels to scroll (default: 300). */
  amount?: number;
  /** Optional element to scroll within. */
  selector?: SelectorSpec | string;
}

export interface ScrollStep {
  scroll?: ScrollParams | null;
}

export interface DragAndDropParams {
  source: SelectorSpec | string;
  target: SelectorSpec | string;
}

export interface DragAndDropStep {
  dragAndDrop: DragAndDropParams;
}

// ---------------------------------------------------------------------------
// Assertion commands
// ---------------------------------------------------------------------------

export interface AssertVisibleStep {
  assertVisible: string | SelectorSpec;
}

export interface AssertNotVisibleStep {
  assertNotVisible: string | SelectorSpec;
}

export interface AssertTextParams extends SelectorSpec {
  /** Expected exact text (trimmed). */
  expected: string;
}

export interface AssertTextStep {
  assertText: AssertTextParams;
}

export interface AssertContainsTextParams extends SelectorSpec {
  /** Substring the element text should contain. */
  contains: string;
}

export interface AssertContainsTextStep {
  assertContainsText: AssertContainsTextParams;
}

export interface AssertValueParams extends SelectorSpec {
  /** Expected input value. */
  expected: string;
}

export interface AssertValueStep {
  assertValue: AssertValueParams;
}

export interface AssertUrlParams {
  url?: string;
  /** Regex pattern the URL should match. */
  pattern?: string;
}

export interface AssertUrlStep {
  assertUrl: string | AssertUrlParams;
}

export interface AssertTitleParams {
  title?: string;
  contains?: string;
}

export interface AssertTitleStep {
  assertTitle: string | AssertTitleParams;
}

export interface AssertEnabledStep {
  assertEnabled: string | SelectorSpec;
}

export interface AssertDisabledStep {
  assertDisabled: string | SelectorSpec;
}

export interface AssertCheckedStep {
  assertChecked: string | SelectorSpec;
}

export interface AssertUncheckedStep {
  assertUnchecked: string | SelectorSpec;
}

export interface AssertCountParams extends SelectorSpec {
  count: number;
}

export interface AssertCountStep {
  assertCount: AssertCountParams;
}

export interface AssertAttributeParams extends SelectorSpec {
  attribute: string;
  expected: string;
}

export interface AssertAttributeStep {
  assertAttribute: AssertAttributeParams;
}

export interface AssertCssPropertyParams extends SelectorSpec {
  property: string;
  expected: string;
}

export interface AssertCssPropertyStep {
  assertCssProperty: AssertCssPropertyParams;
}

// ---------------------------------------------------------------------------
// Wait commands
// ---------------------------------------------------------------------------

export interface WaitForElementStep {
  waitForElement: string | SelectorSpec;
}

export interface WaitForUrlParams {
  url: string;
  timeout?: number;
}

export interface WaitForUrlStep {
  waitForUrl: string | WaitForUrlParams;
}

export interface WaitForNetworkIdleStep {
  waitForNetworkIdle?: { timeout?: number } | null;
}

// ---------------------------------------------------------------------------
// Utility commands
// ---------------------------------------------------------------------------

export interface PauseStep {
  pause: number;
}

export interface ScreenshotParams {
  /** Output path (relative to artifactsDir). */
  path?: string;
  fullPage?: boolean;
}

export interface ScreenshotStep {
  screenshot?: ScreenshotParams | null;
}

export interface LogStep {
  log: string;
}

export interface RunFlowParams {
  path: string;
  env?: Record<string, string>;
}

export interface RunFlowStep {
  runFlow: string | RunFlowParams;
}

/**
 * Escape hatch: evaluate arbitrary JavaScript.
 * Use only when no declarative command covers the need.
 * The script runs in the browser page context.
 */
export interface EvaluateParams {
  /** JS expression / function body as a string. */
  script: string;
  args?: unknown[];
  /** Name for logging purposes. */
  description?: string;
}

export interface EvaluateStep {
  evaluate: EvaluateParams;
}

// ---------------------------------------------------------------------------
// Union of all step types
// ---------------------------------------------------------------------------

export type Step =
  | NavigateStep
  | ReloadStep
  | GoBackStep
  | GoForwardStep
  | ClickStep
  | DoubleClickStep
  | HoverStep
  | FocusStep
  | FillStep
  | TypeStep
  | SelectStep
  | CheckStep
  | UncheckStep
  | UploadStep
  | PressKeyStep
  | ScrollStep
  | DragAndDropStep
  | AssertVisibleStep
  | AssertNotVisibleStep
  | AssertTextStep
  | AssertContainsTextStep
  | AssertValueStep
  | AssertUrlStep
  | AssertTitleStep
  | AssertEnabledStep
  | AssertDisabledStep
  | AssertCheckedStep
  | AssertUncheckedStep
  | AssertCountStep
  | AssertAttributeStep
  | AssertCssPropertyStep
  | WaitForElementStep
  | WaitForUrlStep
  | WaitForNetworkIdleStep
  | PauseStep
  | ScreenshotStep
  | LogStep
  | RunFlowStep
  | EvaluateStep;

// ---------------------------------------------------------------------------
// Top-level spec file
// ---------------------------------------------------------------------------

export interface SpecFile {
  /** Human-readable name for the spec (used in reports). */
  name: string;
  /** Optional description. */
  description?: string;
  /** Base URL prepended to relative `navigate` URLs. */
  baseUrl?: string;
  browser?: BrowserType;
  viewport?: ViewportSpec;
  /** Run browser without visible window (default: true). */
  headless?: boolean;
  /** Default step timeout in ms (default: 10000). */
  timeout?: number;
  /** Number of retries on failure (default: 0). */
  retries?: number;
  /** Tags for filtering runs (e.g. smoke, regression). */
  tags?: string[];
  /** Environment variables — supports ${VAR} interpolation. */
  env?: Record<string, string>;
  steps: Step[];
}

/** Normalised step: shorthand values expanded, env resolved. */
export type NormalisedStep = Step;
