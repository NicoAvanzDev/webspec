# Agent Integration Guide

This document explains how to integrate an LLM agent with WebSpec — so the agent can generate, validate, and run browser automation specs on behalf of users.

---

## Overview

The integration model has three phases:

1. **Intent classification** — detect what the user wants and refuse mobile/native requests
2. **Spec drafting** — generate a `.spec.yaml` file from the user's description
3. **Apply workflow** — call `webspec generate` to write the file, then `webspec run` to execute it

WebSpec exposes a programmatic API (`src/agent/`) for the first two phases, and the CLI for the third.

---

## Phase 1: Intent classification

```typescript
import { classifyIntent } from 'webspec/agent';

const result = classifyIntent(userMessage);

switch (result.intent) {
  case 'web-automation':
    // Proceed to spec drafting
    break;

  case 'mobile':
    // Tell the user WebSpec is web-only
    reply(result.refusal);
    break;

  case 'unclear':
    // Ask clarifying question
    reply('Are you asking about a web browser flow?');
    break;
}
```

### `classifyIntent(message: string): IntentResult`

Returns:

```typescript
interface IntentResult {
  intent: 'web-automation' | 'mobile' | 'unclear';
  baseUrl?: string;      // extracted URL if present in the message
  refusal?: string;      // pre-built refusal message for mobile intents
}
```

**Mobile refusals**: Any request mentioning iOS, Android, React Native, Xcode, ADB, Expo, Flutter, native app, mobile app, APK, or IPA is classified as `mobile` and must be refused. WebSpec does not support native mobile automation.

---

## Phase 2: Spec drafting

Refer to `docs/spec-format.md` for the full spec format. The agent's job is to translate a natural-language description into a valid `.spec.yaml` document.

### Key rules

1. **One command per step** — each step object has exactly one top-level key.
2. **Selector priority** — prefer `text > role > testid > label > placeholder > css > xpath`. Never write raw `css` or `xpath` selectors when a semantic alternative exists.
3. **Env vars for secrets** — never hardcode passwords or API keys. Use `${VAR}` placeholders and document what variables the caller must provide.
4. **Assertions after actions** — after every significant user action (fill + submit, navigate), include an assertion that confirms the expected outcome.
5. **Reuse flows** — extract repeated steps (login, setup) into `runFlow` references.
6. **No `evaluate` unless necessary** — the `evaluate` escape hatch should be a last resort.

### Proposal format

Use `buildProposal()` to generate a structured proposal object for display to the user before writing:

```typescript
import { buildProposal } from 'webspec/agent';

const proposal = buildProposal({
  specYaml: generatedYaml,
  specName: 'Login flow',
  targetUrl: 'https://example.com',
  envVarsNeeded: ['USERNAME', 'PASSWORD'],
  notes: 'This spec assumes the login form uses standard label text.',
});
```

Returns:

```typescript
interface SpecProposal {
  spec: string;           // the YAML content
  specName: string;
  targetUrl?: string;
  envVarsNeeded: string[];
  cliApplyCommand: string;  // ready-to-run shell command
  cliRunCommand: string;
  notes?: string;
}
```

---

## Phase 3: Apply workflow (CLI call contracts)

### Writing the spec file

```bash
webspec generate --content '<yaml>' [--out path/to/spec.spec.yaml] [--force]
```

Use `buildApplyCommand()` to construct this command:

```typescript
import { buildApplyCommand } from 'webspec/agent';

const cmd = buildApplyCommand({
  specYaml: generatedYaml,
  outPath: 'tests/specs/login.spec.yaml',
  force: false,
});
// → 'webspec generate --content "..." --out tests/specs/login.spec.yaml'
```

### Running the spec

```bash
webspec run tests/specs/login.spec.yaml --base-url https://example.com
```

Use `buildRunCommand()`:

```typescript
import { buildRunCommand } from 'webspec/agent';

const cmd = buildRunCommand({
  specPath: 'tests/specs/login.spec.yaml',
  baseUrl: 'https://example.com',
  headed: false,
  env: { USERNAME: 'alice' },
});
// → 'webspec run tests/specs/login.spec.yaml --base-url https://example.com --env USERNAME=alice'
```

---

## Full agent workflow example

```typescript
import { classifyIntent, buildApplyCommand, buildRunCommand, buildProposal } from 'webspec/agent';

async function handleUserRequest(message: string, targetUrl: string) {
  // 1. Classify
  const { intent, refusal } = classifyIntent(message);
  if (intent === 'mobile') return { error: refusal };
  if (intent === 'unclear') return { error: 'Please describe a web browser interaction.' };

  // 2. Draft spec (agent-specific logic)
  const specYaml = await draftSpecWithLLM(message, targetUrl);

  // 3. Build proposal
  const proposal = buildProposal({
    specYaml,
    specName: 'My generated spec',
    targetUrl,
    envVarsNeeded: [],
  });

  // 4. Return to caller — they can run:
  //    webspec generate --content "..." && webspec run ...
  return {
    spec: proposal.spec,
    applyCommand: proposal.cliApplyCommand,
    runCommand: proposal.cliRunCommand,
  };
}
```

---

## System prompt guidance

Load the full agent system prompt from `prompts/webspec-agent-system-prompt.md` and inject it as the system message before any user interaction. It covers:

- Intent detection and mobile refusal
- Spec drafting rules (selector priority, assertion patterns, env vars for secrets)
- CLI call contract (exact shell commands to write and run specs)
- What WebSpec cannot do (see `docs/limitations.md`)

---

## Programmatic API

For programmatic use (without the CLI), import from the package root:

```typescript
import {
  // Core
  parseSpec, parseSpecFromString,
  normaliseSteps, resolveEnv, resolveFlows,
  // Config
  resolveConfig, loadConfig,
  // Runtime
  runSpec, runMany,
  // Agent
  classifyIntent, buildApplyCommand, buildRunCommand, buildProposal,
  // Errors
  WebSpecError, ValidationError, StepError, MobileNotSupportedError,
} from 'webspec';
```

See `src/index.ts` for the full public API surface.
