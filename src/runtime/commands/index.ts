/**
 * Command registry: maps command keys to their handler + describe functions.
 *
 * Each entry has:
 *   - execute: async function(step, ctx) → void
 *   - describe: function(step) → string  (for logging)
 *
 * `runFlow` is NOT registered here — it is resolved before execution
 * by the flow resolver and its steps are inlined.
 */

import type { Step } from '../../types/spec';
import type { ExecutionContext } from '../context';

import {
  handleNavigate, describeNavigate,
  handleReload, describeReload,
  handleGoBack, describeGoBack,
  handleGoForward, describeGoForward,
} from './navigation';

import {
  handleClick, describeClick,
  handleDoubleClick, describeDoubleClick,
  handleHover, describeHover,
  handleFocus, describeFocus,
  handleFill, describeFill,
  handleType, describeType,
  handleSelect, describeSelect,
  handleCheck, describeCheck,
  handleUncheck, describeUncheck,
  handleUpload, describeUpload,
  handlePressKey, describePressKey,
  handleScroll, describeScroll,
  handleDragAndDrop, describeDragAndDrop,
} from './interactions';

import {
  handleAssertVisible, describeAssertVisible,
  handleAssertNotVisible, describeAssertNotVisible,
  handleAssertText, describeAssertText,
  handleAssertContainsText, describeAssertContainsText,
  handleAssertValue, describeAssertValue,
  handleAssertUrl, describeAssertUrl,
  handleAssertTitle, describeAssertTitle,
  handleAssertEnabled, describeAssertEnabled,
  handleAssertDisabled, describeAssertDisabled,
  handleAssertChecked, describeAssertChecked,
  handleAssertUnchecked, describeAssertUnchecked,
  handleAssertCount, describeAssertCount,
  handleAssertAttribute, describeAssertAttribute,
  handleAssertCssProperty, describeAssertCssProperty,
} from './assertions';

import {
  handleWaitForElement, describeWaitForElement,
  handleWaitForUrl, describeWaitForUrl,
  handleWaitForNetworkIdle, describeWaitForNetworkIdle,
} from './waiting';

import {
  handlePause, describePause,
  handleScreenshot, describeScreenshot,
  handleLog, describeLog,
  handleEvaluate, describeEvaluate,
} from './utilities';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (step: any, ctx: ExecutionContext) => Promise<void>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Describer = (step: any) => string;

export interface CommandEntry {
  execute: Handler;
  describe: Describer;
}

/** Registry of all supported commands, keyed by step property name. */
export const COMMAND_REGISTRY: Record<string, CommandEntry> = {
  navigate:              { execute: handleNavigate,            describe: describeNavigate },
  reload:                { execute: handleReload,              describe: describeReload },
  goBack:                { execute: handleGoBack,              describe: describeGoBack },
  goForward:             { execute: handleGoForward,           describe: describeGoForward },

  click:                 { execute: handleClick,               describe: describeClick },
  doubleClick:           { execute: handleDoubleClick,         describe: describeDoubleClick },
  hover:                 { execute: handleHover,               describe: describeHover },
  focus:                 { execute: handleFocus,               describe: describeFocus },
  fill:                  { execute: handleFill,                describe: describeFill },
  type:                  { execute: handleType,                describe: describeType },
  select:                { execute: handleSelect,              describe: describeSelect },
  check:                 { execute: handleCheck,               describe: describeCheck },
  uncheck:               { execute: handleUncheck,             describe: describeUncheck },
  upload:                { execute: handleUpload,              describe: describeUpload },
  pressKey:              { execute: handlePressKey,            describe: describePressKey },
  scroll:                { execute: handleScroll,              describe: describeScroll },
  dragAndDrop:           { execute: handleDragAndDrop,         describe: describeDragAndDrop },

  assertVisible:         { execute: handleAssertVisible,       describe: describeAssertVisible },
  assertNotVisible:      { execute: handleAssertNotVisible,    describe: describeAssertNotVisible },
  assertText:            { execute: handleAssertText,          describe: describeAssertText },
  assertContainsText:    { execute: handleAssertContainsText,  describe: describeAssertContainsText },
  assertValue:           { execute: handleAssertValue,         describe: describeAssertValue },
  assertUrl:             { execute: handleAssertUrl,           describe: describeAssertUrl },
  assertTitle:           { execute: handleAssertTitle,         describe: describeAssertTitle },
  assertEnabled:         { execute: handleAssertEnabled,       describe: describeAssertEnabled },
  assertDisabled:        { execute: handleAssertDisabled,      describe: describeAssertDisabled },
  assertChecked:         { execute: handleAssertChecked,       describe: describeAssertChecked },
  assertUnchecked:       { execute: handleAssertUnchecked,     describe: describeAssertUnchecked },
  assertCount:           { execute: handleAssertCount,         describe: describeAssertCount },
  assertAttribute:       { execute: handleAssertAttribute,     describe: describeAssertAttribute },
  assertCssProperty:     { execute: handleAssertCssProperty,   describe: describeAssertCssProperty },

  waitForElement:        { execute: handleWaitForElement,      describe: describeWaitForElement },
  waitForUrl:            { execute: handleWaitForUrl,          describe: describeWaitForUrl },
  waitForNetworkIdle:    { execute: handleWaitForNetworkIdle,  describe: describeWaitForNetworkIdle },

  pause:                 { execute: handlePause,               describe: describePause },
  screenshot:            { execute: handleScreenshot,          describe: describeScreenshot },
  log:                   { execute: handleLog,                 describe: describeLog },
  evaluate:              { execute: handleEvaluate,            describe: describeEvaluate },
};

/**
 * Extract the command key from a step object.
 * A step should have exactly one top-level key that identifies the command.
 */
export function getCommandKey(step: Step): string | undefined {
  const keys = Object.keys(step);
  // Find the first key that matches a known command
  for (const key of keys) {
    if (key in COMMAND_REGISTRY) return key;
  }
  // Unknown command — return the first key for error reporting
  return keys[0];
}

/** Return all supported command names. */
export function getSupportedCommands(): string[] {
  return Object.keys(COMMAND_REGISTRY);
}
