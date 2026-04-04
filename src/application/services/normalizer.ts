/**
 * Spec normalization service.
 *
 * Converts shorthand step notations to full canonical form.
 */

import type { Step, NormalisedStep, SelectorSpec } from "../../domain/index";

/**
 * Normalise steps by expanding shorthand notations.
 */
export function normaliseSteps(steps: readonly Step[]): NormalisedStep[] {
  return steps.map(normaliseStep);
}

function normaliseStep(step: Step): NormalisedStep {
  const key = Object.keys(step)[0] as keyof Step;
  const value = step[key];

  // Convert string selectors to object form for interaction commands
  if (
    [
      "click",
      "doubleClick",
      "hover",
      "focus",
      "check",
      "uncheck",
      "assertVisible",
      "assertNotVisible",
      "assertEnabled",
      "assertDisabled",
      "assertChecked",
      "assertUnchecked",
      "waitForElement",
    ].includes(key) &&
    typeof value === "string"
  ) {
    return { [key]: { text: value } } as NormalisedStep;
  }

  // Convert string navigate to object form
  if (key === "navigate" && typeof value === "string") {
    return { [key]: { url: value } } as NormalisedStep;
  }

  return step;
}

/**
 * Extract selector fields from a command params object.
 */
export function extractSelector(params: Record<string, unknown> | string): SelectorSpec | string {
  if (typeof params === "string") {
    return params;
  }

  const selectorFields: (keyof SelectorSpec)[] = [
    "text",
    "role",
    "testid",
    "label",
    "placeholder",
    "css",
    "xpath",
    "exact",
    "nth",
  ];

  const selector: Record<string, unknown> = {};
  for (const field of selectorFields) {
    if (field in params) {
      selector[field] = params[field];
    }
  }

  return selector as SelectorSpec;
}
