/**
 * Navigation command handlers.
 */

import type { Step } from "../../../domain/index";
import type { ExecutionContext } from "../context";
import { buildUrl } from "../context";

export async function handleNavigate(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "navigate" in step ? step.navigate : undefined;
  if (typeof params === "string") {
    await ctx.page.goto(buildUrl(params, ctx.config.baseUrl), { timeout: ctx.timeout });
  } else if (params !== undefined && typeof params === "object") {
    const gotoOptions: {
      timeout: number;
      waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
    } = {
      timeout: ctx.timeout,
    };
    if (params.waitUntil !== undefined) {
      gotoOptions.waitUntil = params.waitUntil;
    }
    await ctx.page.goto(buildUrl(params.url, ctx.config.baseUrl), gotoOptions);
  }
}

export async function handleReload(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "reload" in step ? step.reload : undefined;
  const reloadOptions: {
    timeout: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  } = {
    timeout: ctx.timeout,
  };
  if (params !== null && typeof params === "object" && params.waitUntil !== undefined) {
    reloadOptions.waitUntil = params.waitUntil;
  }
  await ctx.page.reload(reloadOptions);
}

export async function handleGoBack(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "goBack" in step ? step.goBack : undefined;
  await ctx.page.goBack({
    timeout: ctx.timeout,
    ...(params !== null && typeof params === "object" ? { timeout: params.timeout } : {}),
  });
}

export async function handleGoForward(step: Step, ctx: ExecutionContext): Promise<void> {
  const params = "goForward" in step ? step.goForward : undefined;
  await ctx.page.goForward({
    timeout: ctx.timeout,
    ...(params !== null && typeof params === "object" ? { timeout: params.timeout } : {}),
  });
}

export function describeNavigate(step: Step): string {
  const params = "navigate" in step ? step.navigate : undefined;
  if (typeof params === "string") {
    return `navigate to "${params}"`;
  }
  if (params !== undefined && typeof params === "object") {
    return `navigate to "${params.url}"`;
  }
  return "navigate";
}

export function describeReload(): string {
  return "reload page";
}

export function describeGoBack(): string {
  return "go back";
}

export function describeGoForward(): string {
  return "go forward";
}
