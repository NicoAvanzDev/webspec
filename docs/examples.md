# Examples

Walkthrough of common WebSpec use cases.

---

## 1. Login flow

A login spec that reuses a flow file.

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
  - click:
      role: button
      name: Sign in
  - waitForUrl: /dashboard
  - assertVisible:
      testid: user-menu
```

```yaml
# tests/specs/dashboard.spec.yaml
name: Dashboard loads after login
env:
  USERNAME: test@example.com
  PASSWORD: ${TEST_PASSWORD}
steps:
  - runFlow:
      path: ../flows/login.yaml
  - assertTitle:
      contains: Dashboard
  - assertVisible:
      role: heading
      name: Welcome
```

Run it:
```bash
webspec run tests/specs/dashboard.spec.yaml --env TEST_PASSWORD=secret
```

---

## 2. Form validation

Test that client-side form validation shows the right error messages.

```yaml
name: Registration form validation
baseUrl: https://example.com
steps:
  - navigate: /register
  - click:
      role: button
      name: Create account
  - assertVisible:
      text: Email is required
  - fill:
      label: Email
      value: not-an-email
  - click:
      role: button
      name: Create account
  - assertVisible:
      text: Enter a valid email address
  - fill:
      label: Email
      value: user@example.com
  - fill:
      label: Password
      value: short
  - assertVisible:
      text: Password must be at least 8 characters
```

---

## 3. E-commerce checkout

A multi-step flow with nested runFlow references.

```yaml
# tests/specs/checkout.spec.yaml
name: Complete checkout
retries: 1
steps:
  - runFlow:
      path: ../flows/login.yaml
      env:
        USERNAME: buyer@example.com
        PASSWORD: ${BUYER_PASS}

  # Add item to cart
  - navigate: /products/widget-pro
  - click:
      role: button
      name: Add to cart
  - assertVisible:
      testid: cart-badge
  - assertContainsText:
      testid: cart-badge
      contains: "1"

  # Checkout
  - navigate: /checkout
  - assertVisible:
      role: heading
      name: Checkout
  - fill:
      label: Card number
      value: 4242 4242 4242 4242
  - fill:
      label: Expiry
      value: "12/28"
  - fill:
      label: CVC
      value: "123"
  - click:
      role: button
      name: Pay now
  - waitForUrl: /order-confirmation
  - assertVisible:
      testid: order-number
```

---

## 4. Search with dynamic results

Wait for async search results before asserting.

```yaml
name: Product search
steps:
  - navigate: /
  - fill:
      testid: search-input
      value: wireless headphones
  - pressKey: Enter
  - waitForNetworkIdle
  - assertCount:
      css: .product-card
      count: 10
  - assertVisible:
      text: wireless headphones
```

---

## 5. Multi-browser smoke test

Run the same spec against all three browsers:

```bash
webspec run tests/specs/smoke.spec.yaml --browser chromium
webspec run tests/specs/smoke.spec.yaml --browser firefox
webspec run tests/specs/smoke.spec.yaml --browser webkit
```

Or in a CI matrix:

```yaml
# GitHub Actions example
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
steps:
  - run: webspec run --browser ${{ matrix.browser }}
```

---

## 6. Mobile viewport test

WebSpec is web-only, but you can test mobile-responsive layouts by overriding the viewport:

```yaml
name: Mobile homepage
viewport:
  width: 375
  height: 812
steps:
  - navigate: /
  - assertVisible:
      testid: hamburger-menu
  - assertNotVisible:
      testid: desktop-nav
  - click:
      testid: hamburger-menu
  - assertVisible:
      testid: mobile-nav-drawer
```

---

## 7. Screenshot comparison prep

Capture named screenshots at key checkpoints:

```yaml
name: Visual regression checkpoints
steps:
  - navigate: /
  - screenshot:
      path: screenshots/homepage-initial.png
      fullPage: true
  - click:
      testid: theme-toggle
  - screenshot:
      path: screenshots/homepage-dark.png
      fullPage: true
```

---

## 8. Using the programmatic API

```typescript
import { runSpec } from 'webspec';

const result = await runSpec({
  specPath: 'tests/specs/login.spec.yaml',
  baseUrl: 'https://staging.example.com',
  env: { USERNAME: 'test@example.com', PASSWORD: 'secret' },
  reporters: ['console', 'json'],
  retries: 2,
});

if (result.status !== 'passed') {
  console.error(`Spec failed at step ${result.steps.find(s => s.status === 'failed')?.description}`);
  process.exit(1);
}
```
