/**
 * Agent intent detection for WebSpec.
 *
 * This module provides heuristics for an LLM agent to:
 *   1. Classify whether a user request is a WebSpec intent
 *   2. Detect mobile/native requests and refuse them
 *   3. Extract useful metadata from the request
 */

export type IntentClassification =
  | { type: 'webspec'; confidence: 'high' | 'medium'; hints: string[] }
  | { type: 'mobile-rejected'; reason: string }
  | { type: 'other' };

/**
 * Keyword sets used for classification.
 * All matching is case-insensitive.
 */
const WEBSPEC_KEYWORDS = [
  'web test', 'browser test', 'e2e test', 'end-to-end test',
  'click', 'navigate', 'go to', 'open url', 'visit',
  'assert', 'verify', 'check that', 'ensure',
  'fill in', 'type into', 'enter text',
  'page', 'site', 'website', 'web app',
  'spec', 'scenario', 'test case',
  'playwright', 'selenium', 'cypress', 'webspec',
];

const MOBILE_KEYWORDS = [
  'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin',
  'mobile app', 'native app', 'app store', 'play store',
  'appium', 'detox', 'xctest', 'espresso',
  'tap on', 'swipe', 'pinch', 'long press',
  'bundle id', 'package id', 'app id',
  'simulator', 'emulator', 'device farm',
  'maestro', // could be mobile
];

// More specific mobile signals
const STRONG_MOBILE_SIGNALS = [
  'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin',
  'bundle id', 'package id', 'appium', 'detox',
];

/**
 * Classify a natural-language user request.
 */
export function classifyIntent(input: string): IntentClassification {
  const lower = input.toLowerCase();

  // Check for strong mobile signals first
  for (const kw of STRONG_MOBILE_SIGNALS) {
    if (lower.includes(kw)) {
      return {
        type: 'mobile-rejected',
        reason:
          `The request appears to target a mobile/native app (detected: "${kw}"). ` +
          `WebSpec only automates websites and web applications in browsers. ` +
          `If you want mobile web testing, omit the mobile references and specify a viewport instead.`,
      };
    }
  }

  // Score webspec relevance
  const matchedKeywords: string[] = [];
  for (const kw of WEBSPEC_KEYWORDS) {
    if (lower.includes(kw)) matchedKeywords.push(kw);
  }

  if (matchedKeywords.length >= 2) {
    return { type: 'webspec', confidence: 'high', hints: matchedKeywords };
  }
  if (matchedKeywords.length === 1) {
    return { type: 'webspec', confidence: 'medium', hints: matchedKeywords };
  }

  return { type: 'other' };
}

/**
 * Extract a base URL from a user request if present.
 * Returns undefined if none found.
 */
export function extractBaseUrl(input: string): string | undefined {
  const urlMatch = input.match(/https?:\/\/[^\s"']+/i);
  return urlMatch ? urlMatch[0] : undefined;
}

/**
 * Produce a human-readable refusal message for mobile requests.
 */
export function buildMobileRefusal(): string {
  return [
    'WebSpec is a web-only framework.',
    '',
    'It automates websites and web applications running in browsers (Chromium, Firefox, WebKit).',
    'It does NOT support:',
    '  • iOS / Android native apps',
    '  • React Native / Flutter',
    '  • Appium / Detox / XCTest / Espresso',
    '  • App Store / Play Store apps',
    '  • Mobile gestures (tap, swipe, pinch) unless mapped to browser equivalents',
    '',
    'If you need to test a MOBILE WEB SITE (not a native app), you can add a mobile viewport to your spec:',
    '',
    '  viewport:',
    '    width: 390',
    '    height: 844',
    '',
    'Please re-describe your request targeting a web browser URL.',
  ].join('\n');
}
