/**
 * Interaction command handlers.
 */

import type { Step } from "../../../domain/index";
import type { ExecutionContext } from "../context";
import { resolveLocator, describeSelector } from "../../../application/index";

export async function handleClick(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "click" in step ? step.click : undefined;
  if (params !== undefined) {
    const loc = resolveLocator(ctx.page, params);
    await loc.click({ timeout: ctx.timeout });
  }
}

export async function handleDoubleClick(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "doubleClick" in step ? step.doubleClick : undefined;
  if (params !== undefined) {
    const loc = resolveLocator(ctx.page, params);
    await loc.dblclick({ timeout: ctx.timeout });
  }
}

export async function handleHover(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "hover" in step ? step.hover : undefined;
  if (params !== undefined) {
    const loc = resolveLocator(ctx.page, params);
    await loc.hover({ timeout: ctx.timeout });
  }
}

export async function handleFill(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "fill" in step ? step.fill : undefined;
  if (params !== undefined && typeof params === "object") {
    const { value, ...selector } = params;
    const loc = resolveLocator(ctx.page, selector);
    await loc.fill(value, { timeout: ctx.timeout });
  }
}

export async function handleType(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "type" in step ? step.type : undefined;
  if (params !== undefined && typeof params === "object") {
    const { value, delay, ...selector } = params;
    const loc = resolveLocator(ctx.page, selector);
    await loc.pressSequentially(value, { delay: delay ?? 0 });
  }
}

export async function handlePressKey(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "pressKey" in step ? step.pressKey : undefined;
  if (typeof params === "string") {
    await ctx.page.keyboard.press(params);
  } else if (params !== undefined && typeof params === "object") {
    const { key, ...selectorFields } = params;
    const hasSelector = Object.keys(selectorFields).some((k) =>
      ["text", "role", "testid", "label", "placeholder", "css", "xpath"].includes(k),
    );
    if (hasSelector) {
      const loc = resolveLocator(ctx.page, selectorFields);
      await loc.press(key, { timeout: ctx.timeout });
    } else {
      await ctx.page.keyboard.press(key);
    }
  }
}

export function describeClick(step: Step): string {
  const params = "click" in step ? step.click : undefined;
  return `click ${describeSelector(params ?? "")}`;
}

export function describeDoubleClick(step: Step): string {
  const params = "doubleClick" in step ? step.doubleClick : undefined;
  return `doubleClick ${describeSelector(params ?? "")}`;
}

export function describeHover(step: Step): string {
  const params = "hover" in step ? step.hover : undefined;
  return `hover ${describeSelector(params ?? "")}`;
}

export function describeFill(step: Step): string {
  const params = "fill" in step ? step.fill : undefined;
  if (params !== undefined && typeof params === "object") {
    const { value, ...sel } = params;
    return `fill ${describeSelector(sel)} → "${value}"`;
  }
  return "fill";
}

export function describeType(step: Step): string {
  const params = "type" in step ? step.type : undefined;
  if (params !== undefined && typeof params === "object") {
    const { value, ...sel } = params;
    return `type ${describeSelector(sel)} → "${value}"`;
  }
  return "type";
}

export function describePressKey(step: Step): string {
  const params = "pressKey" in step ? step.pressKey : undefined;
  if (typeof params === "string") {
    return `press "${params}"`;
  }
  if (params !== undefined && typeof params === "object") {
    return `press "${params.key}"`;
  }
  return "pressKey";
}
