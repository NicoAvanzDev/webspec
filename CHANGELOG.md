# Changelog

All notable changes to WebSpec will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [0.1.0] — 2026-04-04

Initial release.

### Added

**Core**
- YAML-first spec format with `${VAR:-default}` env interpolation
- Shorthand syntax: `navigate: /path`, `click: "text"`, `assertVisible: "text"`, etc.
- Reusable flows via `runFlow:` with circular dependency detection
- Full selector priority system: text → role → testid → label → placeholder → css → xpath
- `nth:` and `exact:` selector modifiers

**Commands (38 total)**
- Navigation: `navigate`, `reload`, `goBack`, `goForward`
- Interactions: `click`, `doubleClick`, `hover`, `focus`, `fill`, `type`, `select`, `check`, `uncheck`, `upload`, `pressKey`, `scroll`, `dragAndDrop`
- Assertions: `assertVisible`, `assertNotVisible`, `assertText`, `assertContainsText`, `assertValue`, `assertUrl`, `assertTitle`, `assertEnabled`, `assertDisabled`, `assertChecked`, `assertUnchecked`, `assertCount`, `assertAttribute`, `assertCssProperty`
- Waiting: `waitForElement`, `waitForUrl`, `waitForNetworkIdle`
- Utilities: `pause`, `screenshot`, `log`, `evaluate`, `runFlow`

**Config system**
- `webspec.config.yaml` discovery (walks up from cwd)
- Config precedence: CLI flags > `WEBSPEC_*` env vars > spec file > config file > defaults
- `WEBSPEC_BASE_URL`, `WEBSPEC_BROWSER`, `WEBSPEC_HEADLESS`, `WEBSPEC_TIMEOUT` overrides

**CLI**
- `webspec run` — run specs with full option set
- `webspec validate` — schema validation without execution
- `webspec inspect` — print resolved spec JSON
- `webspec init` — scaffold new project
- `webspec generate` — write spec from YAML content (agent-facing)
- `webspec archive` — archive spec + metadata to artifacts dir
- `webspec doctor` — environment health check

**Runtime**
- Playwright Chromium/Firefox/WebKit support
- Per-spec retries
- Screenshot capture (on / off / only-on-failure)
- Trace capture (on / off / retain-on-failure)
- Reporters: console (colour), JSON, JUnit XML

**Agent harness**
- `classifyIntent()` — web vs. mobile vs. unclear intent detection
- `buildProposal()` — structured spec proposal with CLI commands
- `buildApplyCommand()` / `buildRunCommand()` — CLI call contracts
- Mobile refusal messages
- System prompts: `prompts/webspec-agent-system-prompt.md`, `prompts/webspec-builder-prompt.md`
- Drafting guidelines: `src/agent/drafting-guidelines.md`

**Tests**
- 82 passing tests (unit + integration)
- Unit: schema, normalisation, env resolution, config, flow resolution, spec parsing, intent, selector resolution
- Integration: real Playwright browser runs against a local fixture HTML app
