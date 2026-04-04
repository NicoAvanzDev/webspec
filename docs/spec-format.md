# Spec Format Reference

Spec files are YAML documents with a `.spec.yaml` extension.

---

## Top-level structure

```yaml
name: Human-readable spec name       # required
description: Optional description    # optional

# Per-spec overrides (all optional)
baseUrl: https://example.com
browser: chromium                    # chromium | firefox | webkit
viewport:
  width: 1280
  height: 720
headless: true
timeout: 10000                       # ms per step
retries: 1
tags: [smoke, auth]
env:
  API_URL: https://api.example.com

steps:
  - navigate: /login
  - fill:
      label: Email
      value: user@example.com
  - click: Sign In
```

---

## Environment variable interpolation

Use `${VAR}` to reference variables. Use `${VAR:-default}` for a fallback value.

```yaml
env:
  HOST: https://staging.example.com

steps:
  - navigate: ${HOST}/login
  - fill:
      label: Username
      value: ${TEST_USER:-admin}
```

Variables are resolved from (highest priority first):
1. `--env` CLI flags
2. `process.env`
3. Spec `env:` block
4. `webspec.config.yaml` `env:` block

---

## Shorthand syntax

Many commands accept a bare string as shorthand for the most common case:

| Shorthand | Equivalent verbose form |
|---|---|
| `navigate: /path` | `navigate: { url: /path }` |
| `click: "Button text"` | `click: { text: "Button text" }` |
| `assertVisible: "Heading"` | `assertVisible: { text: "Heading" }` |
| `assertUrl: /dashboard` | `assertUrl: { url: /dashboard }` |
| `pressKey: Enter` | `pressKey: { key: Enter }` |
| `runFlow: ./flows/login.yaml` | `runFlow: { path: ./flows/login.yaml }` |
| `waitForUrl: /home` | `waitForUrl: { url: /home }` |

---

## Selector fields

Selectors are **inlined directly** into command objects. Priority order (best first):

| Field | Playwright method | Example |
|---|---|---|
| `text` | `getByText()` | `text: "Sign In"` |
| `role` | `getByRole()` | `role: button`, `name: Submit` |
| `testid` | `getByTestId()` | `testid: login-form` |
| `label` | `getByLabel()` | `label: Email address` |
| `placeholder` | `getByPlaceholder()` | `placeholder: Search...` |
| `css` | `locator()` | `css: .btn-primary` |
| `xpath` | `locator('xpath=...')` | `xpath: //button[@type='submit']` |

**Additional modifier fields** (work with any selector):

| Field | Description |
|---|---|
| `exact` | Require exact text/label match (default: `false`) |
| `nth` | 0-based index when multiple elements match |
| `name` | ARIA name (for `role` selector only) |

**Example:**
```yaml
- click:
    role: button
    name: Submit
    exact: true
- fill:
    label: Email address
    value: user@example.com
- assertVisible:
    testid: success-message
    nth: 0
```

---

## Command reference

### Navigation

#### `navigate`
```yaml
- navigate: /login
# or verbose:
- navigate:
    url: https://example.com/login
    waitUntil: networkidle      # load | domcontentloaded | networkidle | commit
    timeout: 15000
```

#### `reload`
```yaml
- reload
# or with options:
- reload:
    waitUntil: domcontentloaded
```

#### `goBack` / `goForward`
```yaml
- goBack
- goForward
```

---

### Interactions

#### `click` / `doubleClick` / `hover` / `focus`
```yaml
- click: "Submit"
- click:
    role: button
    name: Submit
- doubleClick:
    css: .editable-cell
- hover:
    testid: tooltip-trigger
```

#### `fill`
Clears the input and types the value.
```yaml
- fill:
    label: Email
    value: user@example.com
- fill:
    testid: search-box
    value: ${QUERY}
    clear: true          # explicit clear before fill (default: true)
```

#### `type`
Types into the element without clearing first. Useful for appending text.
```yaml
- type:
    label: Message
    value: Hello world
    delay: 50            # ms between keystrokes (simulates human typing)
```

#### `select`
Select one or more options in a `<select>` element.
```yaml
- select:
    label: Country
    value: US
- select:
    testid: multi-select
    value: [option-a, option-b]
```

#### `check` / `uncheck`
```yaml
- check:
    label: Accept terms
- uncheck:
    testid: newsletter-opt-in
```

#### `upload`
```yaml
- upload:
    label: Profile picture
    file: ./fixtures/avatar.png
- upload:
    testid: bulk-upload
    file:
      - ./fixtures/doc1.pdf
      - ./fixtures/doc2.pdf
```

#### `pressKey`
Presses a key, optionally targeted at a specific element.
```yaml
- pressKey: Enter
- pressKey:
    key: Control+A
- pressKey:
    key: Tab
    testid: email-field
```

Common keys: `Enter`, `Tab`, `Escape`, `Space`, `Backspace`, `ArrowDown`, `Control+A`, `Meta+Enter`.

#### `scroll`
```yaml
- scroll                        # scroll down 300px
- scroll:
    direction: up
    amount: 500
- scroll:
    direction: down
    selector:
      css: .infinite-list
```

#### `dragAndDrop`
```yaml
- dragAndDrop:
    source:
      testid: drag-item
    target:
      testid: drop-zone
```

---

### Assertions

All assertions use Playwright's auto-retrying `expect()` — they retry until the condition is met or the timeout is reached.

#### `assertVisible` / `assertNotVisible`
```yaml
- assertVisible: "Welcome back"
- assertVisible:
    testid: dashboard-panel
- assertNotVisible:
    css: .loading-spinner
```

#### `assertText`
Asserts the element's text content equals the expected value exactly.
```yaml
- assertText:
    testid: user-name
    expected: Alice
```

#### `assertContainsText`
Asserts the element's text contains the given substring.
```yaml
- assertContainsText:
    role: heading
    name: Dashboard
    contains: Welcome
```

#### `assertValue`
Asserts an input's current value.
```yaml
- assertValue:
    label: Email
    expected: user@example.com
```

#### `assertUrl`
```yaml
- assertUrl: /dashboard
- assertUrl:
    url: https://example.com/dashboard
- assertUrl:
    pattern: /dashboard.*        # regex pattern
```

#### `assertTitle`
```yaml
- assertTitle: My App — Dashboard
- assertTitle:
    contains: Dashboard
```

#### `assertEnabled` / `assertDisabled`
```yaml
- assertEnabled:
    role: button
    name: Submit
- assertDisabled:
    testid: delete-btn
```

#### `assertChecked` / `assertUnchecked`
```yaml
- assertChecked:
    label: Accept terms
- assertUnchecked:
    testid: opt-out
```

#### `assertCount`
Asserts the number of matching elements.
```yaml
- assertCount:
    css: .product-card
    count: 12
```

#### `assertAttribute`
```yaml
- assertAttribute:
    testid: profile-link
    attribute: href
    expected: /profile/alice
```

#### `assertCssProperty`
```yaml
- assertCssProperty:
    testid: hero-banner
    property: display
    expected: flex
```

---

### Waiting

#### `waitForElement`
Waits for an element to appear in the DOM and be visible.
```yaml
- waitForElement: "Loading complete"
- waitForElement:
    testid: results-table
```

#### `waitForUrl`
```yaml
- waitForUrl: /dashboard
- waitForUrl:
    url: /dashboard
    timeout: 5000
```

#### `waitForNetworkIdle`
Waits until there are no in-flight network requests.
```yaml
- waitForNetworkIdle
- waitForNetworkIdle:
    timeout: 10000
```

---

### Utilities

#### `pause`
Pauses execution for a fixed duration (ms). Avoid in CI — use waitFor commands instead.
```yaml
- pause: 500
```

#### `screenshot`
Takes a screenshot at this point in the flow.
```yaml
- screenshot
- screenshot:
    path: ./artifacts/before-submit.png
    fullPage: true
```

#### `log`
Emits a message to the WebSpec logger.
```yaml
- log: "About to submit the form"
```

#### `runFlow`
Inlines the steps from another spec/flow file. Resolved recursively before execution.
```yaml
- runFlow: ./flows/login.yaml
- runFlow:
    path: ./flows/login.yaml
    env:
      USERNAME: admin
      PASSWORD: secret
```

Flow files have the same structure as spec files. `runFlow` steps cannot be nested inside each other's `env` — they inline at the call site.

#### `evaluate`
Escape hatch: run arbitrary JavaScript in the browser page context.
```yaml
- evaluate:
    script: "document.cookie = 'session=abc123'"
    description: Set session cookie
```

> **Warning**: `evaluate` bypasses WebSpec's abstractions. Use only when no built-in command covers your use case.

---

## Reusable flows

Flow files are spec YAML files that can be `runFlow`-referenced from other specs.
They live in `flowsDir` (default: `tests/flows/`).

```
tests/
  flows/
    login.yaml          ← reusable login flow
    setup-user.yaml
  specs/
    checkout.spec.yaml  ← references flows/login.yaml
```

```yaml
# tests/flows/login.yaml
name: Login flow
steps:
  - navigate: /login
  - fill:
      label: Email
      value: ${USERNAME}
  - fill:
      label: Password
      value: ${PASSWORD}
  - click: Sign In
  - waitForUrl: /dashboard
```

```yaml
# tests/specs/checkout.spec.yaml
name: Checkout flow
steps:
  - runFlow:
      path: ../flows/login.yaml
      env:
        USERNAME: buyer@example.com
        PASSWORD: ${BUYER_PASS}
  - navigate: /shop
  - click: Add to Cart
```
