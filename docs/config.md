# Configuration Reference

WebSpec is configured via `webspec.config.yaml` (or `webspec.config.yml`).

The file is discovered by walking up from the current working directory to the filesystem root. The first file found is used.

---

## Config precedence

Highest to lowest priority:

1. **CLI flags** (e.g. `--base-url`, `--browser`)
2. **`WEBSPEC_*` environment variables**
3. **Spec file fields** (e.g. `baseUrl:` in a `.spec.yaml`)
4. **`webspec.config.yaml`** (this file)
5. **Built-in defaults**

---

## Full example

```yaml
# webspec.config.yaml

baseUrl: https://app.example.com
browser: chromium
viewport:
  width: 1440
  height: 900
headless: true
timeout: 10000
retries: 1

specsDir: tests/specs
flowsDir: tests/flows
screenshotsDir: webspec-artifacts/screenshots
artifactsDir: webspec-artifacts

screenshot: only-on-failure
trace: retain-on-failure

reporters:
  - console
  - json

env:
  API_URL: https://api.example.com
  APP_ENV: test
```

---

## Field reference

### `baseUrl`

**Type**: `string`  
**Default**: `""`

Base URL prepended to relative paths in `navigate` steps. Equivalent to Playwright's `baseURL` context option.

```yaml
baseUrl: https://staging.example.com
```

### `browser`

**Type**: `chromium | firefox | webkit`  
**Default**: `chromium`

Browser to launch. Playwright must have the corresponding browser installed (`pnpm exec playwright install`).

### `viewport`

**Type**: `{ width: number, height: number }`  
**Default**: `{ width: 1280, height: 720 }`

Default browser viewport dimensions.

### `headless`

**Type**: `boolean`  
**Default**: `true`

Run browser without a visible window. Set `false` for local debugging.

### `timeout`

**Type**: `number` (milliseconds)  
**Default**: `10000`

Per-step timeout. Applies to all Playwright operations and `expect()` assertions.

### `retries`

**Type**: `number` (integer ≥ 0)  
**Default**: `0`

Number of times to retry a failing spec before marking it failed.

### `specsDir`

**Type**: `string` (path, relative to config file)  
**Default**: `tests/specs`

Directory scanned for `.spec.yaml` files when no explicit paths are passed to `webspec run`.

### `flowsDir`

**Type**: `string` (path, relative to config file)  
**Default**: `tests/flows`

Directory containing reusable flow files referenced via `runFlow:`.

### `screenshotsDir`

**Type**: `string` (path, relative to config file)  
**Default**: `webspec-artifacts/screenshots`

Where failure screenshots are written.

### `artifactsDir`

**Type**: `string` (path, relative to config file)  
**Default**: `webspec-artifacts`

Root directory for all artifacts: traces, JSON/JUnit reports, archives.

### `screenshot`

**Type**: `on | off | only-on-failure`  
**Default**: `only-on-failure`

When to capture screenshots:
- `on` — after every step
- `off` — never
- `only-on-failure` — only when a step fails

### `trace`

**Type**: `on | off | retain-on-failure`  
**Default**: `off`

Playwright trace recording mode:
- `on` — record and save for every spec
- `off` — no tracing
- `retain-on-failure` — record but only save if the spec fails

Trace archives are written to `<artifactsDir>/trace-<name>-<timestamp>.zip`. View with `pnpm exec playwright show-trace <path>`.

### `reporters`

**Type**: `Array<console | json | junit>`  
**Default**: `["console"]`

Active output reporters:
- `console` — colour terminal output
- `json` — writes `<artifactsDir>/report.json`
- `junit` — writes `<artifactsDir>/report.xml` (for CI systems)

### `env`

**Type**: `Record<string, string>`  
**Default**: `{}`

Default environment variable values available for `${VAR}` interpolation in spec files. Lowest-priority env layer — overridden by spec `env:` blocks, `process.env`, and CLI `--env` flags.

---

## Environment variable overrides

These environment variables can override config file values from the shell (e.g. in CI pipelines):

| Variable | Overrides | Example |
|---|---|---|
| `WEBSPEC_BASE_URL` | `baseUrl` | `WEBSPEC_BASE_URL=https://prod.example.com` |
| `WEBSPEC_BROWSER` | `browser` | `WEBSPEC_BROWSER=firefox` |
| `WEBSPEC_HEADLESS` | `headless` | `WEBSPEC_HEADLESS=false` |
| `WEBSPEC_TIMEOUT` | `timeout` | `WEBSPEC_TIMEOUT=20000` |
