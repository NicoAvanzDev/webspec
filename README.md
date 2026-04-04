# WebSpec

A CLI + runtime + agent-harness integration framework for browser web automation.

WebSpec lets you write readable, declarative YAML specs for browser flows and run them with Playwright — with first-class support for LLM agent integration.

---

## Features

- **YAML-first specs** — human-readable, composable with `runFlow`, `${VAR}` interpolation
- **Playwright-powered** — full Chromium/Firefox/WebKit support, auto-retrying assertions
- **Agent harness** — intent classification, mobile refusal, spec drafting guidance, CLI call contracts
- **Layered config** — CLI flags > env vars > spec file > config file > built-in defaults
- **Reporters** — console, JSON, JUnit XML
- **Traces + screenshots** — configurable capture modes for debugging

---

## Quick start

```bash
# Install
pnpm add webspec
pnpm exec playwright install chromium

# Initialise a project
pnpm exec webspec init

# Write a spec
cat > tests/specs/homepage.spec.yaml << 'EOF'
name: Homepage loads
baseUrl: https://example.com
steps:
  - navigate: /
  - assertTitle: Example Domain
  - assertVisible: "Example Domain"
EOF

# Run it
pnpm exec webspec run tests/specs/homepage.spec.yaml
```

---

## Installation

```bash
pnpm add webspec
# or
npm install webspec
```

Install Playwright browsers:

```bash
pnpm exec playwright install          # all browsers
pnpm exec playwright install chromium  # chromium only
```

---

## Writing specs

```yaml
name: Login flow
baseUrl: https://app.example.com
env:
  PASSWORD: ${TEST_PASSWORD}

steps:
  - navigate: /login
  - fill:
      label: Email
      value: user@example.com
  - fill:
      label: Password
      value: ${PASSWORD}
  - click:
      role: button
      name: Sign in
  - waitForUrl: /dashboard
  - assertVisible:
      testid: user-menu
```

See [docs/spec-format.md](docs/spec-format.md) for the full spec format reference.

---

## CLI

```
webspec run [specs...]          Run specs
webspec validate [specs...]     Validate without running
webspec inspect <spec>          Show resolved spec
webspec init                    Scaffold a new project
webspec generate --content <y>  Write spec from YAML (agent-facing)
webspec archive <spec>          Archive spec + metadata
webspec doctor                  Check environment
```

See [docs/cli.md](docs/cli.md) for full documentation.

---

## Configuration

```yaml
# webspec.config.yaml
baseUrl: https://app.example.com
browser: chromium
timeout: 10000
retries: 1
screenshot: only-on-failure
trace: retain-on-failure
reporters: [console, json]
```

See [docs/config.md](docs/config.md) for all options.

---

## Reusable flows

Extract repeated steps into flow files:

```yaml
# tests/flows/login.yaml
name: Login
steps:
  - navigate: /login
  - fill: { label: Email, value: ${USERNAME} }
  - fill: { label: Password, value: ${PASSWORD} }
  - click: Sign in
  - waitForUrl: /dashboard
```

Reference from any spec:

```yaml
steps:
  - runFlow:
      path: ../flows/login.yaml
      env:
        USERNAME: alice@example.com
        PASSWORD: ${ALICE_PASS}
```

---

## Agent integration

WebSpec ships with an agent harness for LLM-powered spec generation:

```typescript
import { classifyIntent, buildProposal, buildApplyCommand, buildRunCommand } from 'webspec/agent';

const { intent, refusal } = classifyIntent(userMessage);
if (intent === 'mobile') return reply(refusal);

const proposal = buildProposal({ specYaml, specName, targetUrl, envVarsNeeded });
// → { spec, cliApplyCommand, cliRunCommand, ... }
```

See [docs/agent-integration.md](docs/agent-integration.md) and [prompts/](prompts/) for system prompts.

---

## Programmatic API

```typescript
import { runSpec, runMany } from 'webspec';

const result = await runSpec({
  specPath: 'tests/specs/login.spec.yaml',
  baseUrl: 'https://staging.example.com',
  env: { PASSWORD: 'secret' },
  reporters: ['console'],
});

console.log(result.status); // 'passed' | 'failed' | 'error'
```

---

## Project structure

```
webspec.config.yaml
tests/
  specs/       ← .spec.yaml files
  flows/       ← reusable flow files
webspec-artifacts/
  screenshots/
  report.json
  report.xml
```

---

## License

MIT
