/**
 * Domain errors for WebSpec.
 *
 * All errors extend WebSpecError to provide a common base class
 * and support for error chaining with cause.
 */

/** Base class for all WebSpec-specific errors. */
export class WebSpecError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'WebSpecError';
    // Maintain proper prototype chain in CJS
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when a spec or config file fails schema validation. */
export class ValidationError extends WebSpecError {
  constructor(
    message: string,
    public readonly errors: readonly string[],
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when a spec step fails during runtime execution. */
export class StepError extends WebSpecError {
  constructor(
    message: string,
    public readonly stepIndex: number,
    public readonly command: string,
    cause?: Error,
  ) {
    super(message, cause);
    this.name = 'StepError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when a runFlow reference creates a circular dependency. */
export class CircularFlowError extends WebSpecError {
  constructor(public readonly cycle: readonly string[]) {
    super(`Circular flow dependency detected: ${cycle.join(' → ')}`);
    this.name = 'CircularFlowError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when a referenced flow file cannot be found. */
export class FlowNotFoundError extends WebSpecError {
  constructor(public readonly flowPath: string) {
    super(`Flow file not found: ${flowPath}`);
    this.name = 'FlowNotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when the user requests a mobile/native app test. */
export class MobileNotSupportedError extends WebSpecError {
  constructor() {
    super(
      'WebSpec is a web-only framework. Mobile app automation (iOS, Android, React Native) is out of scope. ' +
        'If you need mobile web testing, set a mobile viewport in your spec file.',
    );
    this.name = 'MobileNotSupportedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when a required config key is missing. */
export class ConfigError extends WebSpecError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Format an error for user-facing display.
 */
export function formatError(err: unknown): string {
  if (err instanceof ValidationError) {
    return [`Validation failed:`, ...err.errors.map((e) => `  • ${e}`)].join('\n');
  }
  if (err instanceof WebSpecError) {
    return err.message + (err.cause ? `\n  Caused by: ${err.cause.message}` : '');
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
