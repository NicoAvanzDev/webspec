# WebSpec

[![CI](https://github.com/NicoAvanzDev/webspec/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/NicoAvanzDev/webspec/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nicoavanzdev/webspec)](https://www.npmjs.com/package/@nicoavanzdev/webspec)

Browser automation for the agent era. Describe a web flow in plain language — your AI agent writes the spec and runs it.

WebSpec is a YAML-spec + Playwright runtime designed to be driven by AI agents (Claude Code, Codex, OpenCode). You almost never touch the YAML.

---

## How it works

```text
You:   /webspec:draft "test that login shows an error on bad credentials"
Agent: Drafting spec...
       ✓ tests/specs/login-error.spec.yaml written

You:   /webspec:run tests/specs/login-error.spec.yaml
Agent: Running spec against https://app.example.com ...
       ✓ navigate /login
       ✓ fill Email — wrong@example.com
       ✓ fill Password — wrongpassword
       ✓ click Sign in
       ✓ assertVisible "Invalid email or password"
       Passed in 1.3s
```

---

## Quick start

Install globally:

```bash
npm install -g @nicoavanzdev/webspec
playwright install chromium
```

Initialise a project:

```bash
cd your-project
webspec init
```

Install agent harness files (SKILL.md + slash commands):

```bash
webspec install
```

Then tell your agent: `/webspec:draft "describe the flow you want to test"`

---

## Agent setup

`webspec install` writes everything your AI agent needs into the repo — a reference guide and four slash commands — for whichever harnesses you choose:

| Harness | Slash commands |
|---------|---------------|
| Claude Code | `/webspec:draft` `/webspec:run` `/webspec:validate` `/webspec:inspect` |
| OpenCode | `/webspec-draft` `/webspec-run` `/webspec-validate` `/webspec-inspect` |
| Codex | `webspec-draft` `webspec-run` `webspec-validate` `webspec-inspect` |

**Non-interactive install:**

```bash
webspec install --tools all                  # all harnesses
webspec install --tools claude,opencode      # specific harnesses
```

### Slash commands

| Command | What it does |
|---------|-------------|
| `/webspec:draft` | Draft a new spec from a plain-language description |
| `/webspec:run` | Run a spec against a browser |
| `/webspec:validate` | Validate a spec for schema and syntax errors |
| `/webspec:inspect` | Inspect a live URL and suggest a spec |

---

## What the agent writes

Specs are YAML files that the agent generates — you read them for review, not to author them.

```yaml
name: Login error on bad credentials
baseUrl: https://app.example.com
env:
  PASSWORD: ${TEST_PASSWORD}

steps:
  - navigate: /login
  - fill:
      label: Email
      value: wrong@example.com
  - fill:
      label: Password
      value: wrongpassword
  - click:
      role: button
      name: Sign in
  - assertVisible:
      text: Invalid email or password
```

See [docs/spec-format.md](docs/spec-format.md) for the full format reference.

---

## CLI reference

```
webspec install   Install agent harness files into this repo
webspec init      Scaffold project config and example spec
webspec run       Run one or more specs
webspec validate  Validate specs without running
webspec inspect   Inspect a URL and suggest a spec
webspec generate  Write a spec file from YAML content (agent-facing)
webspec doctor    Check Playwright and environment
webspec archive   Archive a spec with its metadata
```

See [docs/cli.md](docs/cli.md) for full documentation.

---

## Web-only

WebSpec automates browsers via Playwright. It does not support native mobile apps (iOS, Android, React Native). The agent harness is trained to refuse mobile requests and explain why.

---

## Docs

- [Getting started / agent setup](docs/agent-integration.md)
- [Spec format reference](docs/spec-format.md)
- [CLI reference](docs/cli.md)
- [Configuration](docs/config.md)
- [Examples](docs/examples.md)
- [Limitations](docs/limitations.md)

---

## License

MIT
