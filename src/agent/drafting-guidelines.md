# WebSpec Agent — Spec Drafting Guidelines

This document is intended for LLM agents and harnesses that generate WebSpec YAML
on behalf of users. Follow these rules to produce valid, idiomatic, runnable specs.

---

## 1. Workflow

1. **Classify intent** — call `classifyIntent(userInput)`.
   - `type: 'other'` → do not generate a spec; ask the user to clarify.
   - `type: 'mobile-rejected'` → call `buildMobileRefusal()` and respond with it.
   - `type: 'webspec'` → proceed.
2. **Draft the spec** — produce YAML according to the rules below.
3. **Present a proposal** — call `buildProposal(yaml, outputPath)` and show the
   user the spec before writing. Never apply without confirmation unless the user
   explicitly says "apply" or "write it".
4. **Apply via CLI** — when confirmed, use `buildApplyCommand(args)` to obtain the
   shell command and instruct the user to run it (or run it yourself if you have
   shell access).
5. **Run via CLI** — optionally use `buildRunCommand(args)` to execute the spec.

---

## 2. Spec header fields

```yaml
name: <short human-readable name>           # required
description: |                              # optional but recommended
  Multi-line description.
baseUrl: ${BASE_URL:-https://example.com}   # required — use env interpolation
browser: chromium                           # chromium | firefox | webkit
timeout: 10000                              # ms, default 10 000
retries: 0                                  # default 0
tags:                                       # optional
  - smoke
env:                                        # optional — defines/overrides env vars for this spec
  MY_VAR: ${MY_VAR:-default}
```

**Rules:**
- `name` must be present and unique within a project.
- `baseUrl` must always use `${VAR:-default}` interpolation so it can be
  overridden by the environment without modifying the file.
- Do not hard-code credentials. Always interpolate from env: `${PASSWORD:-}`.

---

## 3. Selector fields

Selectors are **inlined directly** into command objects — there is no nested
`selector:` key.

Priority order (prefer higher-priority selectors):

| Priority | Field         | Example value            |
|----------|---------------|--------------------------|
| 1        | `text`        | `"Sign In"`              |
| 2        | `role`        | `"button"` / `"heading"` |
| 3        | `testid`      | `"submit-btn"`           |
| 4        | `label`       | `"Email address"`        |
| 5        | `placeholder` | `"Enter password"`       |
| 6        | `css`         | `"#login-form button"`   |
| 7        | `xpath`       | `"//button[@type='submit']"` |

Optional modifiers:
- `exact: true` — require exact text / name match (default: false, partial match).
- `nth: 0` — zero-based index when multiple elements match.
- `name` — aria-name (used together with `role`).

**Shorthand string form** — most commands accept a plain string as a text shorthand:

```yaml
- click: "Sign In"           # equivalent to: click: { text: "Sign In" }
- assertVisible: "Dashboard" # equivalent to: assertVisible: { text: "Dashboard" }
```

Use shorthand for simple cases; use verbose form when you need `role`, `label`,
`nth`, or `exact`.

---

## 4. Command reference

### Navigation

```yaml
- navigate: /path              # relative to baseUrl
- navigate:
    url: https://example.com/page
    waitUntil: networkidle     # load | domcontentloaded | networkidle | commit
- reload:                      # reload current page
- goBack:
- goForward:
```

### Interactions

```yaml
- click: "Button text"
- click:
    role: button
    name: Submit
- doubleClick: "Item label"
- hover:
    css: .dropdown-trigger
- focus:
    label: Search
- fill:
    label: Email
    value: ${EMAIL}
    clear: true                # optional — clears field first
- type:
    placeholder: "Enter text"
    value: Hello world
    delay: 50                  # ms between keystrokes
- select:
    label: Country
    value: "United States"     # or array for multi-select
- check: "Remember me"
- uncheck:
    label: Marketing emails
- upload:
    label: Profile photo
    file: ./fixtures/avatar.png
- pressKey: "Enter"
- pressKey:
    key: "Tab"
    label: Password            # optional — focus element first
- scroll:                      # scroll window (null/omit = default down scroll)
- scroll:
    direction: down
    amount: 500
    selector: ".feed-container" # optional — scroll inside element
- dragAndDrop:
    source: "Drag me"
    target: ".drop-zone"
```

### Assertions

```yaml
- assertVisible: "Welcome"
- assertNotVisible:
    css: .error-banner
- assertText:
    role: heading
    name: Dashboard
    expected: "My Dashboard"   # exact text
- assertContainsText:
    css: .alert
    contains: "successfully"
- assertValue:
    label: Email
    expected: user@example.com
- assertUrl: /dashboard
- assertUrl:
    pattern: ".*\\/dashboard$"
- assertTitle: "My App – Dashboard"
- assertTitle:
    contains: Dashboard
- assertEnabled:
    role: button
    name: Submit
- assertDisabled: "Submit"
- assertChecked: "Remember me"
- assertUnchecked: "Marketing emails"
- assertCount:
    css: .product-card
    count: 12
- assertAttribute:
    css: img.logo
    attribute: alt
    expected: "Company Logo"
- assertCssProperty:
    css: .hero-banner
    property: display
    expected: flex
```

### Waiting

```yaml
- waitForElement: "Results"
- waitForUrl: /success
- waitForUrl:
    url: /success
    timeout: 5000
- waitForNetworkIdle:
- waitForNetworkIdle:
    timeout: 8000
```

### Utilities

```yaml
- pause: 1000                  # ms — use sparingly; prefer waitForElement
- screenshot:                  # capture at this point
- screenshot:
    path: ./screenshots/step.png
    fullPage: true
- log: "Reached checkout step"
- runFlow: ./flows/login.yaml
- runFlow:
    path: ./flows/login.yaml
    env:
      EMAIL: admin@example.com
- evaluate:
    script: "window.scrollTo(0, document.body.scrollHeight)"
    description: Scroll to bottom
```

---

## 5. Environment interpolation

Syntax: `${VAR_NAME}` or `${VAR_NAME:-default_value}`

- Resolved at runtime from `process.env` and the spec's own `env:` block.
- Always provide a sensible default: `${BASE_URL:-https://staging.example.com}`.
- Secrets must never be hardcoded; use `${PASSWORD:-}` (empty default).

---

## 6. Reusable flows (`runFlow`)

Shared flows live in a `flows/` directory relative to the spec. They are
ordinary spec files with a `steps:` list. Before execution, `runFlow` steps
are resolved and inlined into the parent step list — there is no nesting at
runtime.

```yaml
# flows/login.yaml
name: login flow
baseUrl: ${BASE_URL:-https://example.com}
steps:
  - navigate: /login
  - fill:
      label: Email
      value: ${EMAIL}
  - fill:
      label: Password
      value: ${PASSWORD}
  - click:
      role: button
      name: Sign In
```

Invoke it from a parent spec:

```yaml
steps:
  - runFlow: ./flows/login.yaml
  - assertVisible: Dashboard
```

Pass environment overrides:

```yaml
  - runFlow:
      path: ./flows/login.yaml
      env:
        EMAIL: admin@example.com
```

---

## 7. Common patterns

### Login then assert

```yaml
steps:
  - navigate: /login
  - fill:
      label: Email
      value: ${EMAIL}
  - fill:
      label: Password
      value: ${PASSWORD}
  - click:
      role: button
      name: Sign In
  - waitForUrl: /dashboard
  - assertVisible:
      role: heading
      name: Dashboard
```

### Form submission with validation

```yaml
steps:
  - navigate: /register
  - fill:
      label: Username
      value: ""
  - click:
      role: button
      name: Register
  - assertVisible:
      css: .field-error
  - assertContainsText:
      css: .field-error
      contains: required
```

### Table / list count assertion

```yaml
steps:
  - navigate: /products
  - assertCount:
      css: .product-card
      count: 10
```

---

## 8. Anti-patterns — do NOT generate these

| Wrong | Correct |
|-------|---------|
| `selector: { text: "Sign In" }` | `text: Sign In` (inline) |
| Hard-coded `baseUrl: https://prod.example.com` | `baseUrl: ${BASE_URL:-https://prod.example.com}` |
| Hard-coded `PASSWORD: s3cr3t` | `PASSWORD: ${PASSWORD:-}` |
| `pause: 3000` without explanation | Use `waitForElement` or `waitForUrl` instead |
| Using `xpath` when `role`/`label` works | Prefer semantic selectors over xpath |
| Omitting `waitForUrl` after navigation | Always confirm URL after form submit |
| `assertText` for partial text | Use `assertContainsText` for partial matches |

---

## 9. File naming convention

- Spec files: `<feature>.spec.yaml` — e.g., `checkout.spec.yaml`
- Flow files: `flows/<name>.yaml` — e.g., `flows/login.yaml`
- Suggested output path: `specs/<feature>.spec.yaml`

---

## 10. Validation before applying

Always validate before writing:

```sh
webspec validate <path>
```

The `webspec generate --dry-run` flag shows a diff without writing.
