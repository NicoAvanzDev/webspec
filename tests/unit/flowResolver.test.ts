/**
 * Unit tests for flow resolver.
 */

import { describe, it, expect } from "vitest";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { resolveFlows } from "../../src/core/flowResolver";
import type { Step } from "../../src/types/spec";

function writeTempFlow(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

describe("resolveFlows", () => {
  it("passes through non-runFlow steps unchanged", async () => {
    const steps: Step[] = [{ navigate: "/path" }, { click: "Button" }];
    const result = await resolveFlows(steps, {
      parentPath: "/fake/parent.yaml",
      env: {},
    });
    expect(result).toEqual(steps);
  });

  it("inlines steps from a referenced flow", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webspec-flow-"));

    writeTempFlow(
      tmpDir,
      "login.yaml",
      `name: login flow\nsteps:\n  - navigate: /login\n  - click: "Sign In"\n`,
    );

    const parentPath = path.join(tmpDir, "parent.yaml");
    const steps: Step[] = [{ runFlow: "./login.yaml" }];

    const result = await resolveFlows(steps, {
      parentPath,
      env: {},
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ navigate: { url: "/login" } });
    expect(result[1]).toEqual({ click: { text: "Sign In" } });

    fs.unlinkSync(path.join(tmpDir, "login.yaml"));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("throws FlowNotFoundError for missing flow file", async () => {
    const steps: Step[] = [{ runFlow: "./nonexistent.yaml" }];
    await expect(resolveFlows(steps, { parentPath: "/fake/parent.yaml", env: {} })).rejects.toThrow(
      /Flow file not found/,
    );
  });

  it("throws CircularFlowError for circular dependencies", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webspec-circular-"));

    // a.yaml → b.yaml → a.yaml
    writeTempFlow(tmpDir, "a.yaml", `name: a\nsteps:\n  - runFlow: ./b.yaml\n`);
    writeTempFlow(tmpDir, "b.yaml", `name: b\nsteps:\n  - runFlow: ./a.yaml\n`);

    const parentPath = path.join(tmpDir, "main.yaml");
    const steps: Step[] = [{ runFlow: "./a.yaml" }];

    await expect(resolveFlows(steps, { parentPath, env: {} })).rejects.toThrow(/Circular/);

    fs.unlinkSync(path.join(tmpDir, "a.yaml"));
    fs.unlinkSync(path.join(tmpDir, "b.yaml"));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
