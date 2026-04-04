# Limitations

WebSpec is a web-only browser automation framework. This document describes what it does NOT support.

---

## Mobile / native apps

WebSpec does **not** support:

- iOS apps (UIKit, SwiftUI)
- Android apps (Android SDK)
- React Native / Expo apps
- Flutter mobile apps
- Electron apps (native window automation)
- ADB-based testing
- Appium flows
- Xcode UI testing

For mobile web testing, use a `viewport:` override in your spec file to simulate a mobile screen size. WebSpec will open that viewport in a desktop browser — it does **not** launch a real device emulator or connect to a physical device.

For native mobile automation, use [Maestro](https://maestro.mobile.dev) or Appium.

---

## Visual / pixel regression

WebSpec can **capture** screenshots but it does **not** do pixel-level image diffing. It has no concept of:

- Snapshot comparison
- Perceptual diff
- Baseline images
- Screenshot approval workflows

For visual regression, use tools like [Percy](https://percy.io), [Chromatic](https://www.chromatic.com), or [playwright-visual-comparisons](https://playwright.dev/docs/test-screenshots).

---

## Network interception / mocking

WebSpec does **not** provide built-in network mocking. There is no way to intercept requests, stub API responses, or assert on network calls from a spec file.

If you need request mocking, use Playwright directly or add an `evaluate` step to install a service worker.

---

## Browser extensions

WebSpec cannot install or test browser extensions. It launches a clean browser profile with no extensions.

---

## Multi-tab / multi-page flows

WebSpec manages a single browser page per spec. There is no built-in support for:

- Opening new tabs
- Switching between browser windows
- Pop-up window handling (beyond basic dialogs)

If your flow requires multi-tab logic, use the `evaluate` command to script it, or handle it at the Playwright layer using the programmatic API.

---

## File downloads / OS-level dialogs

WebSpec does not provide a command for asserting on downloaded files or interacting with OS-level file save dialogs. The `upload` command works for `<input type="file">` only.

---

## Authentication state persistence

Each spec run launches a fresh browser context with no cookies or storage. There is no built-in mechanism to persist auth state between spec files (e.g. Playwright's `storageState`).

Workaround: use a `runFlow` reference that logs in at the start of each spec, or use the `evaluate` command to set cookies directly.

---

## Performance / load testing

WebSpec is a functional correctness tool. It runs one browser instance per spec and does not support:

- Concurrent virtual user simulation
- Throughput / latency measurement
- Core Web Vitals measurement (use Lighthouse or Playwright's `performance.measure` via `evaluate`)

---

## CI screenshot diffs / test result history

WebSpec produces screenshots, JSON reports, and JUnit XML, but it does not store or compare historical run data. Integrate with a CI platform (GitHub Actions, GitLab CI, etc.) and use their test reporting features for trend analysis.

---

## Accessibility auditing

WebSpec does not run Lighthouse accessibility audits or axe-core checks. Use `@axe-core/playwright` or the `evaluate` command to inject and run an axe audit within a spec.
