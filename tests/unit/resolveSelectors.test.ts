/**
 * Unit tests for resolveLocator and describeSelector.
 *
 * Uses Playwright's mock Page via vi.fn() — no real browser needed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveLocator, describeSelector } from "../../src/core/resolveSelectors";
import { WebSpecError } from "../../src/utils/errors";
import type { SelectorSpec } from "../../src/types/spec";
import type { Locator, Page } from "playwright";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockLocator(name: string): Locator {
  const loc = {
    _name: name,
    nth: vi.fn((n: number) => makeMockLocator(`${name}[nth=${n}]`)),
  } as unknown as Locator;
  return loc;
}

function makeMockPage(): Page {
  return {
    getByText: vi.fn((t: string) => makeMockLocator(`text:${t}`)),
    getByRole: vi.fn((r: string) => makeMockLocator(`role:${r}`)),
    getByTestId: vi.fn((id: string) => makeMockLocator(`testid:${id}`)),
    getByLabel: vi.fn((l: string) => makeMockLocator(`label:${l}`)),
    getByPlaceholder: vi.fn((p: string) => makeMockLocator(`ph:${p}`)),
    locator: vi.fn((s: string) => makeMockLocator(`locator:${s}`)),
  } as unknown as Page;
}

// ---------------------------------------------------------------------------
// resolveLocator
// ---------------------------------------------------------------------------

describe("resolveLocator", () => {
  let page: Page;

  beforeEach(() => {
    page = makeMockPage();
  });

  it("bare string → getByText with exact:false", () => {
    resolveLocator(page, "Sign In");
    expect(page.getByText).toHaveBeenCalledWith("Sign In", { exact: false });
  });

  it("text selector → getByText", () => {
    resolveLocator(page, { text: "Hello" });
    expect(page.getByText).toHaveBeenCalledWith("Hello", { exact: false });
  });

  it("text selector with exact:true", () => {
    resolveLocator(page, { text: "Hello", exact: true });
    expect(page.getByText).toHaveBeenCalledWith("Hello", { exact: true });
  });

  it("role selector → getByRole", () => {
    resolveLocator(page, { role: "button", name: "Submit" });
    expect(page.getByRole).toHaveBeenCalledWith("button", { name: "Submit", exact: undefined });
  });

  it("role selector without name", () => {
    resolveLocator(page, { role: "heading" });
    expect(page.getByRole).toHaveBeenCalledWith("heading", {});
  });

  it("testid selector → getByTestId", () => {
    resolveLocator(page, { testid: "main-heading" });
    expect(page.getByTestId).toHaveBeenCalledWith("main-heading");
  });

  it("label selector → getByLabel", () => {
    resolveLocator(page, { label: "Email address" });
    expect(page.getByLabel).toHaveBeenCalledWith("Email address", {});
  });

  it("placeholder selector → getByPlaceholder", () => {
    resolveLocator(page, { placeholder: "Search..." });
    expect(page.getByPlaceholder).toHaveBeenCalledWith("Search...", {});
  });

  it("css selector → locator", () => {
    resolveLocator(page, { css: ".nav-link" });
    expect(page.locator).toHaveBeenCalledWith(".nav-link");
  });

  it("xpath selector → locator with xpath= prefix", () => {
    resolveLocator(page, { xpath: '//button[@type="submit"]' });
    expect(page.locator).toHaveBeenCalledWith('xpath=//button[@type="submit"]');
  });

  it("applies .nth() when selector has nth", () => {
    const loc = resolveLocator(page, { text: "Item", nth: 2 });
    expect(page.getByText).toHaveBeenCalled();
    // The returned locator should have nth called
    const baseLoc = (page.getByText as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value as Locator & { nth: ReturnType<typeof vi.fn> };
    expect(baseLoc.nth).toHaveBeenCalledWith(2);
    // The returned value should be the nth() result
    expect(loc).toBe(baseLoc.nth.mock.results[0]?.value);
  });

  it("throws WebSpecError when no selector field is provided", () => {
    // An empty object (no text/role/testid/etc.)
    const sel = {} as unknown as SelectorSpec;
    expect(() => resolveLocator(page, sel)).toThrow(WebSpecError);
    expect(() => resolveLocator(page, sel)).toThrow(/No valid selector field/);
  });
});

// ---------------------------------------------------------------------------
// describeSelector
// ---------------------------------------------------------------------------

describe("describeSelector", () => {
  it('string → text="..."', () => {
    expect(describeSelector("Sign In")).toBe('text="Sign In"');
  });

  it("text field", () => {
    expect(describeSelector({ text: "Hello" })).toBe('text="Hello"');
  });

  it("role without name", () => {
    expect(describeSelector({ role: "button" })).toBe("role=button");
  });

  it("role with name", () => {
    expect(describeSelector({ role: "button", name: "Submit" })).toBe('role=button[name="Submit"]');
  });

  it("testid", () => {
    expect(describeSelector({ testid: "nav-menu" })).toBe('testid="nav-menu"');
  });

  it("label", () => {
    expect(describeSelector({ label: "Password" })).toBe('label="Password"');
  });

  it("placeholder", () => {
    expect(describeSelector({ placeholder: "Enter email" })).toBe('placeholder="Enter email"');
  });

  it("css", () => {
    expect(describeSelector({ css: ".btn-primary" })).toBe('css=".btn-primary"');
  });

  it("xpath", () => {
    expect(describeSelector({ xpath: "//div" })).toBe('xpath="//div"');
  });

  it("unknown selector → <unknown selector>", () => {
    expect(describeSelector({} as SelectorSpec)).toBe("<unknown selector>");
  });
});
