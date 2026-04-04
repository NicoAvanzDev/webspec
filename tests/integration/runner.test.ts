/**
 * Integration test: run a spec against the local fixture web app.
 *
 * This test starts a local HTTP server serving tests/fixtures/simple-app/index.html
 * and runs a real spec against it using the WebSpec runtime.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runSpec } from '../../src/runtime/runner';
import { parseSpecFromString } from '../../src/core/parseSpec';
import { stringifyYaml } from '../../src/utils/yaml';

const FIXTURE_DIR = path.join(__dirname, '..', 'fixtures', 'simple-app');
let server: http.Server;
let baseUrl: string;

beforeAll(() => {
  return new Promise<void>((resolve) => {
    server = http.createServer((req, res) => {
      const filePath = path.join(FIXTURE_DIR, 'index.html');
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Runner integration', () => {
  it('runs a simple navigation + assertion spec', async () => {
    const specYaml = `
name: fixture - homepage
steps:
  - navigate: /
  - assertVisible:
      testid: main-heading
  - assertTitle: WebSpec Test Fixture
`;
    const spec = parseSpecFromString(specYaml);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webspec-int-'));
    const specPath = path.join(tmpDir, 'fixture.spec.yaml');
    fs.writeFileSync(specPath, stringifyYaml(spec), 'utf-8');

    const result = await runSpec({
      specPath,
      baseUrl,
      cwd: tmpDir,
      reporters: [],
    });

    expect(result.status).toBe('passed');
    expect(result.failedSteps).toBe(0);
    expect(result.passedSteps).toBeGreaterThan(0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }, 30000);

  it('reports failure when assertion fails', async () => {
    const specYaml = `
name: fixture - intentional failure
steps:
  - navigate: /
  - assertVisible:
      text: This text does not exist on the page at all
`;
    const spec = parseSpecFromString(specYaml);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webspec-fail-'));
    const specPath = path.join(tmpDir, 'fail.spec.yaml');
    fs.writeFileSync(specPath, stringifyYaml(spec), 'utf-8');

    const result = await runSpec({
      specPath,
      baseUrl,
      cwd: tmpDir,
      reporters: [],
      timeout: 3000,
    });

    expect(result.status).toBe('failed');
    expect(result.failedSteps).toBeGreaterThan(0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }, 30000);
});
