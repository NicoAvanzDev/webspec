/**
 * Core domain types for WebSpec spec files (.spec.yaml).
 *
 * These types define the contract between the user-facing YAML format
 * and the internal runtime representation.
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
  readonly text?: string;
  /** Match by ARIA role (e.g. "button", "heading", "link"). */
  readonly role?: string;
  /** Accessible name when using `role`. */
  readonly name?: string;
  /** Match by data-testid attribute. */
  readonly testid?: string;
  /** Match by associated label text. */
  readonly label?: string;
  /** Match by placeholder attribute. */
  readonly placeholder?: string;
  /** CSS selector. */
  readonly css?: string;
  /** XPath expression (use as last resort). */
  readonly xpath?: string;
  /** Require exact text/label match (default: false). */
  readonly exact?: boolean;
  /** Select the nth match (0-based). Use sparingly. */
  readonly nth?: number;
}

// ---------------------------------------------------------------------------
// Browser / viewport
// ---------------------------------------------------------------------------

export type BrowserType = "chromium" | "firefox" | "webkit";

export interface ViewportSpec {
  readonly width: number;
  readonly height: number;
}

// ---------------------------------------------------------------------------
// Navigation commands
// ---------------------------------------------------------------------------

export interface NavigateParams {
  readonly url: string;
  readonly waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  readonly timeout?: number;
}

export interface NavigateStep {
  readonly navigate: string | NavigateParams;
}

export interface ReloadStep {
  readonly reload?: {
    readonly waitUntil?: NavigateParams["waitUntil"];
    readonly timeout?: number;
  } | null;
}

export interface GoBackStep {
  readonly goBack?: { readonly timeout?: number } | null;
}

export interface GoForwardStep {
  readonly goForward?: { readonly timeout?: number } | null;
}

// ---------------------------------------------------------------------------
// Interaction commands
// ---------------------------------------------------------------------------

export interface ClickStep {
  readonly click: string | SelectorSpec;
}

export interface DoubleClickStep {
  readonly doubleClick: string | SelectorSpec;
}

export interface HoverStep {
  readonly hover: string | SelectorSpec;
}

export interface FocusStep {
  readonly focus: string | SelectorSpec;
}

export interface FillParams extends SelectorSpec {
  /** Value to fill into the input. */
  readonly value: string;
  /** Clear the field before typing (default: true). */
  readonly clear?: boolean;
}

export interface FillStep {
  readonly fill: FillParams;
}

export interface TypeParams extends SelectorSpec {
  /** Text to type character-by-character. */
  readonly value: string;
  /** Delay between keystrokes in ms. */
  readonly delay?: number;
}

export interface TypeStep {
  readonly type: TypeParams;
}

export interface SelectParams extends SelectorSpec {
  /** Option value(s) to select. */
  readonly value: string | readonly string[];
}

export interface SelectStep {
  readonly select: SelectParams;
}

export interface CheckStep {
  readonly check: string | SelectorSpec;
}

export interface UncheckStep {
  readonly uncheck: string | SelectorSpec;
}

export interface UploadParams extends SelectorSpec {
  /** File path(s) relative to cwd. */
  readonly file: string | readonly string[];
}

export interface UploadStep {
  readonly upload: UploadParams;
}

export interface PressKeyParams extends Partial<SelectorSpec> {
  /** Key or key combo, e.g. "Enter", "Control+A", "Escape". */
  readonly key: string;
}

export interface PressKeyStep {
  readonly pressKey: string | PressKeyParams;
}

export interface ScrollParams {
  readonly direction?: "up" | "down" | "left" | "right";
  /** Pixels to scroll (default: 300). */
  readonly amount?: number;
  /** Optional element to scroll within. */
  readonly selector?: SelectorSpec | string;
}

export interface ScrollStep {
  readonly scroll?: ScrollParams | null;
}

export interface DragAndDropParams {
  readonly source: SelectorSpec | string;
  readonly target: SelectorSpec | string;
}

export interface DragAndDropStep {
  readonly dragAndDrop: DragAndDropParams;
}

// ---------------------------------------------------------------------------
// Assertion commands
// ---------------------------------------------------------------------------

export interface AssertVisibleStep {
  readonly assertVisible: string | SelectorSpec;
}

export interface AssertNotVisibleStep {
  readonly assertNotVisible: string | SelectorSpec;
}

export interface AssertTextParams extends SelectorSpec {
  /** Expected exact text (trimmed). */
  readonly expected: string;
}

export interface AssertTextStep {
  readonly assertText: AssertTextParams;
}

export interface AssertContainsTextParams extends SelectorSpec {
  /** Substring the element text should contain. */
  readonly contains: string;
}

export interface AssertContainsTextStep {
  readonly assertContainsText: AssertContainsTextParams;
}

export interface AssertValueParams extends SelectorSpec {
  /** Expected input value. */
  readonly expected: string;
}

export interface AssertValueStep {
  readonly assertValue: AssertValueParams;
}

export interface AssertUrlParams {
  readonly url?: string;
  /** Regex pattern the URL should match. */
  readonly pattern?: string;
}

export interface AssertUrlStep {
  readonly assertUrl: string | AssertUrlParams;
}

export interface AssertTitleParams {
  readonly title?: string;
  readonly contains?: string;
}

export interface AssertTitleStep {
  readonly assertTitle: string | AssertTitleParams;
}

export interface AssertEnabledStep {
  readonly assertEnabled: string | SelectorSpec;
}

export interface AssertDisabledStep {
  readonly assertDisabled: string | SelectorSpec;
}

export interface AssertCheckedStep {
  readonly assertChecked: string | SelectorSpec;
}

export interface AssertUncheckedStep {
  readonly assertUnchecked: string | SelectorSpec;
}

export interface AssertCountParams extends SelectorSpec {
  readonly count: number;
}

export interface AssertCountStep {
  readonly assertCount: AssertCountParams;
}

export interface AssertAttributeParams extends SelectorSpec {
  readonly attribute: string;
  readonly expected: string;
}

export interface AssertAttributeStep {
  readonly assertAttribute: AssertAttributeParams;
}

export interface AssertCssPropertyParams extends SelectorSpec {
  readonly property: string;
  readonly expected: string;
}

export interface AssertCssPropertyStep {
  readonly assertCssProperty: AssertCssPropertyParams;
}

// ---------------------------------------------------------------------------
// Wait commands
// ---------------------------------------------------------------------------

export interface WaitForElementStep {
  readonly waitForElement: string | SelectorSpec;
}

export interface WaitForUrlParams {
  readonly url: string;
  readonly timeout?: number;
}

export interface WaitForUrlStep {
  readonly waitForUrl: string | WaitForUrlParams;
}

export interface WaitForNetworkIdleStep {
  readonly waitForNetworkIdle?: { readonly timeout?: number } | null;
}

// ---------------------------------------------------------------------------
// Utility commands
// ---------------------------------------------------------------------------

export interface PauseStep {
  readonly pause: number;
}

export interface ScreenshotParams {
  /** Output path (relative to artifactsDir). */
  readonly path?: string;
  readonly fullPage?: boolean;
}

export interface ScreenshotStep {
  readonly screenshot?: ScreenshotParams | null;
}

export interface LogStep {
  readonly log: string;
}

export interface RunFlowParams {
  readonly path: string;
  readonly env?: Readonly<Record<string, string>>;
}

export interface RunFlowStep {
  readonly runFlow: string | RunFlowParams;
}

/**
 * Escape hatch: evaluate arbitrary JavaScript.
 * Use only when no declarative command covers the need.
 * The script runs in the browser page context.
 */
export interface EvaluateParams {
  /** JS expression / function body as a string. */
  readonly script: string;
  readonly args?: readonly unknown[];
  /** Name for logging purposes. */
  readonly description?: string;
}

export interface EvaluateStep {
  readonly evaluate: EvaluateParams;
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
  readonly name: string;
  /** Optional description. */
  readonly description?: string;
  /** Base URL prepended to relative `navigate` URLs. */
  readonly baseUrl?: string;
  readonly browser?: BrowserType;
  readonly viewport?: ViewportSpec;
  /** Run browser without visible window (default: true). */
  readonly headless?: boolean;
  /** Default step timeout in ms (default: 10000). */
  readonly timeout?: number;
  /** Number of retries on failure (default: 0). */
  readonly retries?: number;
  /** Tags for filtering runs (e.g. smoke, regression). */
  readonly tags?: readonly string[];
  /** Environment variables — supports ${VAR} interpolation. */
  readonly env?: Readonly<Record<string, string>>;
  readonly steps: readonly Step[];
}

/** Normalised step: shorthand values expanded, env resolved. */
export type NormalisedStep = Step;
