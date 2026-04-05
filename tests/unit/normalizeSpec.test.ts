/**
 * Unit tests for spec normalisation.
 */

import { describe, it, expect } from "vitest";
import { normaliseStep, normaliseSteps } from "../../src/application/services/normalizer";
import type { Step } from "../../src/domain/index";

describe("normaliseStep", () => {
  it("expands navigate shorthand string", () => {
    const step: Step = { navigate: "/docs" };
    const result = normaliseStep(step);
    expect(result).toEqual({ navigate: { url: "/docs" } });
  });

  it("leaves navigate object untouched", () => {
    const step: Step = { navigate: { url: "/docs", waitUntil: "networkidle" } };
    expect(normaliseStep(step)).toEqual(step);
  });

  it("expands click string shorthand", () => {
    const step: Step = { click: "Button Text" };
    expect(normaliseStep(step)).toEqual({ click: { text: "Button Text" } });
  });

  it("leaves click object untouched", () => {
    const step: Step = { click: { role: "button", name: "Submit" } };
    expect(normaliseStep(step)).toEqual(step);
  });

  it("expands assertVisible string shorthand", () => {
    const step: Step = { assertVisible: "Heading" };
    expect(normaliseStep(step)).toEqual({ assertVisible: { text: "Heading" } });
  });

  it("expands assertUrl string shorthand", () => {
    const step: Step = { assertUrl: "/dashboard" };
    expect(normaliseStep(step)).toEqual({ assertUrl: { url: "/dashboard" } });
  });

  it("expands assertTitle string shorthand", () => {
    const step: Step = { assertTitle: "Dashboard" };
    expect(normaliseStep(step)).toEqual({
      assertTitle: { title: "Dashboard" },
    });
  });

  it("expands pressKey string shorthand", () => {
    const step: Step = { pressKey: "Enter" };
    expect(normaliseStep(step)).toEqual({ pressKey: { key: "Enter" } });
  });

  it("expands runFlow string shorthand", () => {
    const step: Step = { runFlow: "./flows/login.yaml" };
    expect(normaliseStep(step)).toEqual({
      runFlow: { path: "./flows/login.yaml" },
    });
  });

  it("expands waitForUrl string shorthand", () => {
    const step: Step = { waitForUrl: "/done" };
    expect(normaliseStep(step)).toEqual({ waitForUrl: { url: "/done" } });
  });

  it("expands hover string shorthand", () => {
    const step: Step = { hover: "Menu" };
    expect(normaliseStep(step)).toEqual({ hover: { text: "Menu" } });
  });

  it("leaves fill untouched (already object)", () => {
    const step: Step = { fill: { label: "Email", value: "a@b.com" } };
    expect(normaliseStep(step)).toEqual(step);
  });
});

describe("normaliseSteps", () => {
  it("normalises all steps in an array", () => {
    const steps: Step[] = [{ navigate: "/" }, { click: "Login" }, { assertVisible: "Dashboard" }];
    const result = normaliseSteps(steps);
    expect(result).toEqual([
      { navigate: { url: "/" } },
      { click: { text: "Login" } },
      { assertVisible: { text: "Dashboard" } },
    ]);
  });
});
