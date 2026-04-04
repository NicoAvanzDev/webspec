# CLI Reference

All commands are invoked via the `webspec` binary.

```
webspec <command> [options]
```

---

## `webspec run`

Run one or more spec files.

```
webspec run [specs...] [options]
```

**Arguments**

| Argument | Description |
|---|---|
| `specs` | Glob patterns or explicit paths to `.spec.yaml` files. Defaults to `<specsDir>/**/*.spec.yaml`. |

**Options**

| Flag | Type | Description |
|---|---|---|
| `--headed` | boolean | Run browser in headed (visible) mode. |
| `--browser <name>` | `chromium\|firefox\|webkit` | Override the browser. Default: `chromium`. |
| `--base-url <url>` | string | Base URL prepended to relative `navigate` paths. |
| `--env <KEY=VALUE>` | string (repeatable) | Inject environment variables. |
| `--screenshot <mode>` | `on\|off\|only-on-failure` | Screenshot capture mode. |
| `--trace <mode>` | `on\|off\|retain-on-failure` | Trace capture mode. |
| `--reporter <name>` | `console\|json\|junit` (repeatable) | Output reporters. |
| `--parallel` | boolean | Run specs in parallel. |
| `--timeout <ms>` | number | Per-step timeout in milliseconds. |
| `--retries <n>` | number | Number of retries per failing spec. |
| `--config <path>` | string | Explicit path to `webspec.config.yaml`. |
| `--cwd <dir>` | string | Working directory (default: `process.cwd()`). |

**Examples**

```bash
# Run all specs in the default directory
webspec run

# Run a single spec in headed mode
webspec run tests/specs/login.spec.yaml --headed

# Run against a specific URL with parallel execution
webspec run --base-url https://staging.example.com --parallel

# Inject credentials and capture traces on failure
webspec run --env USERNAME=alice --env PASSWORD=secret --trace retain-on-failure
```

---

## `webspec validate`

Validate spec files against the WebSpec schema without running them.

```
webspec validate [specs...] [options]
```

**Options**

| Flag | Description |
|---|---|
| `--cwd <dir>` | Working directory. |
| `--config <path>` | Config file path. |

**Exit codes**: `0` = all valid, `1` = one or more invalid.

---

## `webspec inspect`

Print the resolved spec (after env substitution and normalisation) without executing it.

```
webspec inspect <spec> [options]
```

**Options**

| Flag | Description |
|---|---|
| `--base-url <url>` | Base URL override. |
| `--env <KEY=VALUE>` | Env variable injection. |
| `--config <path>` | Config file path. |
| `--cwd <dir>` | Working directory. |

Outputs JSON to stdout.

---

## `webspec init`

Scaffold a new WebSpec project in the current directory.

```
webspec init [options]
```

**Options**

| Flag | Description |
|---|---|
| `--cwd <dir>` | Directory to initialise (default: `process.cwd()`). |
| `--force` | Overwrite existing files. |

Creates:
- `webspec.config.yaml`
- `tests/specs/example.spec.yaml`
- `tests/flows/` (empty)

---

## `webspec generate`

Write a spec file from YAML content (agent-facing command).

```
webspec generate --content <yaml> [options]
```

**Options**

| Flag | Description |
|---|---|
| `--content <yaml>` | YAML content string (required). |
| `--out <path>` | Output file path. Defaults to `<specsDir>/<spec-name>.spec.yaml`. |
| `--force` | Overwrite existing file. |
| `--cwd <dir>` | Working directory. |
| `--config <path>` | Config file path. |

Validates content before writing. Exits `1` on validation failure.

---

## `webspec archive`

Archive a spec file and its run metadata to the artifacts directory.

```
webspec archive <spec> [options]
```

**Options**

| Flag | Description |
|---|---|
| `--prompt <text>` | Original agent prompt that generated the spec. |
| `--summary <text>` | Human-readable run summary. |
| `--config <path>` | Config file path. |
| `--cwd <dir>` | Working directory. |

---

## `webspec doctor`

Check the environment, Playwright installation, and configuration.

```
webspec doctor [options]
```

**Options**

| Flag | Description |
|---|---|
| `--cwd <dir>` | Working directory. |

Checks:
- Node.js version (≥ 18 required)
- Playwright browsers installed
- `webspec.config.yaml` found and valid
- `specsDir` and `flowsDir` exist

---

## Environment variable overrides

The following `WEBSPEC_*` env vars override config file values (but are overridden by CLI flags):

| Variable | Config field |
|---|---|
| `WEBSPEC_BASE_URL` | `baseUrl` |
| `WEBSPEC_BROWSER` | `browser` |
| `WEBSPEC_HEADLESS` | `headless` (`"false"` = headed) |
| `WEBSPEC_TIMEOUT` | `timeout` |
