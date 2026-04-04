# WebSpec — Architecture

## Overview

WebSpec is a **web-only** browser automation framework with three conceptual layers:

```
┌─────────────────────────────────────────────┐
│              Agent Harness Layer            │  ← Intent detection, spec drafting, CLI calls
├─────────────────────────────────────────────┤
│              Spec Definition Layer          │  ← .spec.yaml, flows, config
├─────────────────────────────────────────────┤
│              Execution Layer                │  ← Playwright, command handlers, reporters
└─────────────────────────────────────────────┘
```

---

## Repository Structure

```
src/
  cli/                    CLI entry point and commands
    index.ts              Commander setup, registers sub-commands
    commands/
      init.ts             webspec init
      generate.ts         webspec generate
      validate.ts         webspec validate
      run.ts              webspec run
      inspect.ts          webspec inspect
      doctor.ts           webspec doctor
      archive.ts          webspec archive

  config/                 Config discovery and merging
    defaults.ts           Built-in default values
    loadConfig.ts         Finds and parses webspec.config.yaml
    resolveConfig.ts      Merges all config sources with precedence

  schema/                 Zod schemas for validation
    specSchema.ts         Top-level spec file schema
    configSchema.ts       Config file schema
    commandSchemas/
      index.ts            All step command schemas

  core/                   Pure processing (no Playwright)
    parseSpec.ts          Read + validate a .spec.yaml file
    normalizeSpec.ts      Expand shorthand step forms
    resolveEnv.ts         ${VAR} interpolation
    resolveSelectors.ts   SelectorSpec → Playwright Locator
    flowResolver.ts       Recursively inline runFlow references

  runtime/                Playwright execution
    context.ts            ExecutionContext type, helpers
    runner.ts             Main spec + multi-spec runner
    commands/
      navigation.ts       navigate, reload, goBack, goForward
      interactions.ts     click, fill, type, select, check, etc.
      assertions.ts       assertVisible, assertText, assertUrl, etc.
      waiting.ts          waitForElement, waitForUrl, waitForNetworkIdle
      utilities.ts        pause, screenshot, log, evaluate
      index.ts            Command registry (key → handler)
    reporters/
      console.ts          Colour terminal output
      json.ts             run-summary.json
      junit.ts            test-results.xml (CI)
      index.ts            Reporter facade

  agent/                  Agent harness integration
    intent.ts             Intent classification heuristics
    contracts.ts          Typed API surface for harnesses

  utils/
    fs.ts                 File I/O helpers
    yaml.ts               YAML parse/stringify
    errors.ts             Custom error classes
    logging.ts            Structured logger
    paths.ts              Path resolution utilities

  types/
    spec.ts               TypeScript types for .spec.yaml
    config.ts             TypeScript types for webspec.config.yaml
    results.ts            TypeScript types for run results

  index.ts                Public programmatic API
```

---

## Data Flow

### Spec execution

```
parseSpec(path)
  └─ readFile → parseYaml → validateSpecSchema → SpecFile

normaliseSteps(steps)
  └─ expand shorthands: "text" → { text: "text" }

resolveEnv(steps, env)
  └─ ${VAR} → actual values

resolveFlows(steps, opts)
  └─ runFlow steps → inline referenced flow steps (recursive)

Playwright browser launch
  └─ for each step:
       getCommandKey(step) → look up COMMAND_REGISTRY
       handler.execute(step, ctx)
       on failure: captureScreenshot, mark remaining as skipped
```

### Config precedence

```
CLI flags
  └─ process.env (WEBSPEC_*)
       └─ spec file fields (baseUrl, browser, timeout…)
            └─ webspec.config.yaml
                 └─ built-in defaults
```

---

## Extension Points

### Adding a new command

1. Define the TypeScript type in `src/types/spec.ts`
2. Add a Zod schema in `src/schema/commandSchemas/index.ts`
3. Add the type to the `Step` union in `src/types/spec.ts`
4. Write the handler in the appropriate `src/runtime/commands/*.ts` file
5. Register it in `src/runtime/commands/index.ts`

### Adding a reporter

Implement a function `writeXxxReport(summary: RunSummary, dir: string): string`
and call it from `src/runtime/reporters/index.ts`.

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Package system | CommonJS | Broad compatibility with Node.js tooling |
| Browser engine | Playwright | Best auto-wait, selector strategies, and reliability |
| Assertions | `@playwright/test` expect | Built-in retry, great error messages |
| Validation | Zod | TypeScript-native, composable schemas |
| YAML | js-yaml | Mature, no dependencies |
| Selector strategy | text > role > testid > label > placeholder > css > xpath | Prioritises stable, user-visible identifiers |
| Shorthand expansion | normaliseStep() pre-execution | Keeps handlers simple |
| Flow inlining | Pre-execution | Runners see a flat step list — no recursion at runtime |
