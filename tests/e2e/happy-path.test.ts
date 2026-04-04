/**
 * E2E test: invoke the webspec CLI as a child process against the local fixture app.
 *
 * This test exercises the full pipeline:
 *   CLI binary → spec parsing → Playwright runtime → assertions → exit code
 *
 * Prerequisites (run manually before this suite):
 *   pnpm run build
 *
 * Run with:
 *   npx vitest run tests/e2e/happy-path.test.ts
 *
 * NOTE: this file is excluded from `pnpm test` (unit/integration only).
 *       It must be run explicitly after a successful build.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIXTURE_DIR = path.join(__dirname, "..", "fixtures", "simple-app");
const CLI_PATH = path.join(__dirname, "..", "..", "dist", "cli", "index.js");

/** Serve the fixture HTML on a random port. */
function startFixtureServer(): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const content = fs.readFileSync(path.join(FIXTURE_DIR, "index.html"));
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
      } catch (err) {
        res.writeHead(500);
        res.end("fixture error");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
    server.on("error", reject);
  });
}

/** Run the webspec CLI with given args and return { stdout, stderr, exitCode }. */
async function runCli(
  args: string[],
  env: Record<string, string> = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath, // node
      [CLI_PATH, ...args],
      {
        env: { ...process.env, ...env },
        timeout: 60_000,
      },
    );
    return { stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: typeof e.code === "number" ? e.code : 1,
    };
  }
}

/** Write a temporary spec file and return its path. */
function writeTempSpec(dir: string, name: string, yaml: string): string {
  const specPath = path.join(dir, name);
  fs.writeFileSync(specPath, yaml, "utf-8");
  return specPath;
}

// ---------------------------------------------------------------------------
// Suite setup
// ---------------------------------------------------------------------------

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  // Guard: skip suite if CLI binary does not exist (build not run yet).
  if (!fs.existsSync(CLI_PATH)) {
    console.warn(
      `\n[e2e] SKIP: CLI binary not found at ${CLI_PATH}.\nRun "pnpm run build" first.\n`,
    );
    return;
  }
  ({ server, baseUrl } = await startFixtureServer());
}, 10_000);

afterAll(() => {
  if (server) {
    return new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

// Each test gets its own temp dir.
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "webspec-e2e-"));
});

afterEach(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Guard helper — skip individual tests if binary is absent.
// ---------------------------------------------------------------------------

function requireBuild() {
  if (!fs.existsSync(CLI_PATH)) {
    // Vitest has no native skip-at-runtime; throw a descriptive error instead.
    throw new Error(`CLI binary not found. Run "pnpm run build" before e2e tests.`);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("webspec CLI e2e — happy path", () => {
  it("exits 0 when spec passes: navigate + assertVisible + assertTitle", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "home.spec.yaml",
      `
name: e2e - homepage
steps:
  - navigate: /
  - assertVisible:
      testid: main-heading
  - assertTitle: WebSpec Test Fixture
`,
    );

    const { exitCode, stdout } = await runCli([
      "run",
      specPath,
      "--base-url",
      baseUrl,
      "--reporter",
      "console",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/passed/i);
  }, 45_000);

  it("exits 0 for login flow: fill + click + assertVisible (dashboard)", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "login.spec.yaml",
      `
name: e2e - login happy path
steps:
  - navigate: /#login
  - assertVisible:
      role: heading
      name: Sign In
  - fill:
      label: Email
      value: user@example.com
  - fill:
      label: Password
      value: secret
  - click:
      role: button
      name: Sign In
  - assertVisible:
      role: heading
      name: Dashboard
  - assertVisible:
      testid: welcome-message
`,
    );

    const { exitCode, stdout } = await runCli([
      "run",
      specPath,
      "--base-url",
      baseUrl,
      "--reporter",
      "console",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/passed/i);
  }, 45_000);

  it("exits 0 for login flow using env interpolation", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "login-env.spec.yaml",
      `
name: e2e - login with env vars
env:
  EMAIL: \${TEST_EMAIL:-user@example.com}
  PASSWORD: \${TEST_PASSWORD:-secret}
steps:
  - navigate: /#login
  - fill:
      label: Email
      value: \${EMAIL}
  - fill:
      label: Password
      value: \${PASSWORD}
  - click:
      role: button
      name: Sign In
  - assertVisible:
      role: heading
      name: Dashboard
`,
    );

    const { exitCode } = await runCli(["run", specPath, "--base-url", baseUrl], {
      TEST_EMAIL: "user@example.com",
      TEST_PASSWORD: "secret",
    });

    expect(exitCode).toBe(0);
  }, 45_000);

  it("exits 0 for assertCount on list items", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "count.spec.yaml",
      `
name: e2e - assertCount
steps:
  - navigate: /#login
  - fill:
      label: Email
      value: user@example.com
  - fill:
      label: Password
      value: secret
  - click:
      role: button
      name: Sign In
  - assertVisible:
      role: heading
      name: Dashboard
  - assertCount:
      css: .list-item
      count: 3
`,
    );

    const { exitCode } = await runCli(["run", specPath, "--base-url", baseUrl]);

    expect(exitCode).toBe(0);
  }, 45_000);

  it("exits 0 for screenshot utility step", async () => {
    requireBuild();

    const screenshotPath = path.join(tmpDir, "capture.png");
    const specPath = writeTempSpec(
      tmpDir,
      "screenshot.spec.yaml",
      `
name: e2e - screenshot
steps:
  - navigate: /
  - assertVisible:
      testid: main-heading
  - screenshot:
      path: ${screenshotPath.replace(/\\/g, "/")}
`,
    );

    const { exitCode } = await runCli(["run", specPath, "--base-url", baseUrl]);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(screenshotPath)).toBe(true);
  }, 45_000);

  it("exits 0 for runFlow composing a reusable login flow", async () => {
    requireBuild();

    // Write the shared flow
    const flowsDir = path.join(tmpDir, "flows");
    fs.mkdirSync(flowsDir);
    fs.writeFileSync(
      path.join(flowsDir, "login.yaml"),
      `
name: shared login flow
steps:
  - navigate: /#login
  - fill:
      label: Email
      value: user@example.com
  - fill:
      label: Password
      value: secret
  - click:
      role: button
      name: Sign In
`,
      "utf-8",
    );

    const specPath = writeTempSpec(
      tmpDir,
      "composed.spec.yaml",
      `
name: e2e - runFlow composition
steps:
  - runFlow: ./flows/login.yaml
  - assertVisible:
      role: heading
      name: Dashboard
  - assertCount:
      css: .list-item
      count: 3
`,
    );

    const { exitCode } = await runCli(["run", specPath, "--base-url", baseUrl]);

    expect(exitCode).toBe(0);
  }, 45_000);
});

describe("webspec CLI e2e — failure cases", () => {
  it("exits 1 when assertVisible fails (element absent)", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "fail-visible.spec.yaml",
      `
name: e2e - assertVisible failure
steps:
  - navigate: /
  - assertVisible:
      text: This element does not exist anywhere
`,
    );

    const { exitCode } = await runCli([
      "run",
      specPath,
      "--base-url",
      baseUrl,
      "--timeout",
      "2000",
    ]);

    expect(exitCode).toBe(1);
  }, 45_000);

  it("exits 1 when login credentials are wrong (error shown, dashboard absent)", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "fail-login.spec.yaml",
      `
name: e2e - bad credentials
steps:
  - navigate: /#login
  - fill:
      label: Email
      value: wrong@example.com
  - fill:
      label: Password
      value: wrongpassword
  - click:
      role: button
      name: Sign In
  - assertVisible:
      role: heading
      name: Dashboard
`,
    );

    const { exitCode } = await runCli([
      "run",
      specPath,
      "--base-url",
      baseUrl,
      "--timeout",
      "2000",
    ]);

    expect(exitCode).toBe(1);
  }, 45_000);

  it("exits 1 when assertCount has wrong expected count", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "fail-count.spec.yaml",
      `
name: e2e - assertCount failure
steps:
  - navigate: /#login
  - fill:
      label: Email
      value: user@example.com
  - fill:
      label: Password
      value: secret
  - click:
      role: button
      name: Sign In
  - assertCount:
      css: .list-item
      count: 99
`,
    );

    const { exitCode } = await runCli([
      "run",
      specPath,
      "--base-url",
      baseUrl,
      "--timeout",
      "3000",
    ]);

    expect(exitCode).toBe(1);
  }, 45_000);
});

describe("webspec CLI e2e — validate command", () => {
  it("exits 0 for a valid spec", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "valid.spec.yaml",
      `
name: e2e - valid spec
steps:
  - navigate: /
  - assertVisible:
      testid: main-heading
`,
    );

    const { exitCode } = await runCli(["validate", specPath]);

    expect(exitCode).toBe(0);
  }, 15_000);

  it("exits 1 for an invalid spec (missing required selector field)", async () => {
    requireBuild();

    const specPath = writeTempSpec(
      tmpDir,
      "invalid.spec.yaml",
      `
name: e2e - invalid spec
steps:
  - assertVisible:
      exact: true
`,
    );

    const { exitCode } = await runCli(["validate", specPath]);

    expect(exitCode).toBe(1);
  }, 15_000);
});
