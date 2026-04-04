/**
 * Command registry for step execution.
 *
 * Maps command keys to their handler and description functions.
 */

import type { Step } from '../../../domain/index';
import type { ExecutionContext } from '../context';

import {
  handleNavigate,
  describeNavigate,
  handleReload,
  describeReload,
  handleGoBack,
  describeGoBack,
  handleGoForward,
  describeGoForward,
} from './navigation';

import {
  handleClick,
  describeClick,
  handleDoubleClick,
  describeDoubleClick,
  handleHover,
  describeHover,
  handleFill,
  describeFill,
  handleType,
  describeType,
  handlePressKey,
  describePressKey,
} from './interactions';

import {
  handleAssertVisible,
  describeAssertVisible,
  handleAssertNotVisible,
  describeAssertNotVisible,
  handleAssertText,
  describeAssertText,
  handleAssertContainsText,
  describeAssertContainsText,
  handleAssertUrl,
  describeAssertUrl,
  handleAssertTitle,
  describeAssertTitle,
} from './assertions';

import {
  handleWaitForElement,
  describeWaitForElement,
  handleWaitForUrl,
  describeWaitForUrl,
} from './waiting';

import { handleScreenshot, describeScreenshot, handleLog, describeLog } from './utilities';

type Handler = (step: Step, ctx: ExecutionContext) => Promise<void>;
type Describer = (step: Step) => string;

export interface CommandEntry {
  readonly execute: Handler;
  readonly describe: Describer;
}

export const COMMAND_REGISTRY: Readonly<Record<string, CommandEntry>> = {
  navigate: { execute: handleNavigate, describe: describeNavigate },
  reload: { execute: handleReload, describe: describeReload },
  goBack: { execute: handleGoBack, describe: describeGoBack },
  goForward: { execute: handleGoForward, describe: describeGoForward },

  click: { execute: handleClick, describe: describeClick },
  doubleClick: { execute: handleDoubleClick, describe: describeDoubleClick },
  hover: { execute: handleHover, describe: describeHover },
  fill: { execute: handleFill, describe: describeFill },
  type: { execute: handleType, describe: describeType },
  pressKey: { execute: handlePressKey, describe: describePressKey },

  assertVisible: { execute: handleAssertVisible, describe: describeAssertVisible },
  assertNotVisible: { execute: handleAssertNotVisible, describe: describeAssertNotVisible },
  assertText: { execute: handleAssertText, describe: describeAssertText },
  assertContainsText: { execute: handleAssertContainsText, describe: describeAssertContainsText },
  assertUrl: { execute: handleAssertUrl, describe: describeAssertUrl },
  assertTitle: { execute: handleAssertTitle, describe: describeAssertTitle },

  waitForElement: { execute: handleWaitForElement, describe: describeWaitForElement },
  waitForUrl: { execute: handleWaitForUrl, describe: describeWaitForUrl },

  screenshot: { execute: handleScreenshot, describe: describeScreenshot },
  log: { execute: handleLog, describe: describeLog },
};

/**
 * Extract the command key from a step object.
 */
export function getCommandKey(step: Step): string | undefined {
  const keys = Object.keys(step);
  for (const key of keys) {
    if (key in COMMAND_REGISTRY) {
      return key;
    }
  }
  return keys[0];
}

/**
 * Get all supported command names.
 */
export function getSupportedCommands(): readonly string[] {
  return Object.keys(COMMAND_REGISTRY);
}
