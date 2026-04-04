/**
 * Normalise spec steps: expand shorthand values to their verbose form.
 *
 * After normalisation every step's value is a plain object — no bare
 * strings as values. This makes the runtime command handlers simpler.
 *
 * Examples of shorthand → verbose:
 *   navigate: /docs        → navigate: { url: /docs }
 *   click: "Button text"   → click: { text: "Button text" }
 *   assertVisible: "Foo"   → assertVisible: { text: "Foo" }
 *   assertUrl: /dashboard  → assertUrl: { url: /dashboard }
 *   pressKey: Enter        → pressKey: { key: "Enter" }
 *   runFlow: ./flows/x.yaml → runFlow: { path: ./flows/x.yaml }
 *   waitForUrl: /path      → waitForUrl: { url: /path }
 */

import type { Step } from '../types/spec';

type NormalisedStep = Step;

/** Normalise a single step. */
export function normaliseStep(step: Step): NormalisedStep {
  // navigate
  if ('navigate' in step && typeof step.navigate === 'string') {
    return { navigate: { url: step.navigate } };
  }
  // click / doubleClick / hover / focus / check / uncheck / assertVisible / assertNotVisible
  // assertEnabled / assertDisabled / assertChecked / assertUnchecked / waitForElement
  for (const cmd of [
    'click', 'doubleClick', 'hover', 'focus', 'check', 'uncheck',
    'assertVisible', 'assertNotVisible', 'assertEnabled', 'assertDisabled',
    'assertChecked', 'assertUnchecked', 'waitForElement',
  ] as const) {
    if (cmd in step && typeof (step as Record<string, unknown>)[cmd] === 'string') {
      return { [cmd]: { text: (step as Record<string, unknown>)[cmd] as string } } as unknown as Step;
    }
  }
  // assertUrl
  if ('assertUrl' in step && typeof step.assertUrl === 'string') {
    return { assertUrl: { url: step.assertUrl } };
  }
  // assertTitle
  if ('assertTitle' in step && typeof step.assertTitle === 'string') {
    return { assertTitle: { title: step.assertTitle } };
  }
  // pressKey
  if ('pressKey' in step && typeof step.pressKey === 'string') {
    return { pressKey: { key: step.pressKey } };
  }
  // runFlow
  if ('runFlow' in step && typeof step.runFlow === 'string') {
    return { runFlow: { path: step.runFlow } };
  }
  // waitForUrl
  if ('waitForUrl' in step && typeof step.waitForUrl === 'string') {
    return { waitForUrl: { url: step.waitForUrl } };
  }
  return step;
}

/** Normalise all steps in a spec. */
export function normaliseSteps(steps: Step[]): NormalisedStep[] {
  return steps.map(normaliseStep);
}
