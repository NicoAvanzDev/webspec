/**
 * Harness registry for `webspec install`.
 *
 * Defines the three supported agent harnesses (Claude Code, Codex, OpenCode),
 * the paths where their skill and command files live, and the static content
 * for each file.
 */

import * as os from 'os';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HarnessId = 'claude' | 'codex' | 'opencode';

export interface CommandDef {
  /** Slash-command ID, e.g. "run" → invoked as /webspec:run (Claude) */
  id: string;
  /** One-liner shown in the command picker. */
  description: string;
  /** Full prompt template body. */
  body: string;
}

export interface HarnessDef {
  id: HarnessId;
  /** Human-readable display name. */
  name: string;
  /**
   * Absolute path for the SKILL.md file given a project root.
   * Codex uses the global config dir, so `cwd` is ignored for it.
   */
  skillPath(cwd: string): string;
  /**
   * Absolute path for a slash command file given a project root and command id.
   * Codex commands are global.
   */
  commandPath(cwd: string, commandId: string): string;
  /** Human-readable description of how to invoke a command. */
  invocation(commandId: string): string;
}

// ---------------------------------------------------------------------------
// Shared SKILL.md content (same for all harnesses)
// ---------------------------------------------------------------------------

export const SKILL_MD = `# WebSpec — Agent Reference Guide

WebSpec is a YAML-first, Playwright-powered framework for writing and running
declarative browser-automation specs. Web-only. No native mobile.

## Quick CLI reference

\`\`\`
webspec init                          # scaffold project (config + example spec)
webspec run <spec.yaml> [options]     # run a spec
webspec validate <spec.yaml>          # validate spec schema
webspec generate --content <yaml>     # write a spec file from YAML content
webspec inspect --url <url>           # inspect a URL and suggest a spec
webspec doctor                        # check environment / Playwright install
webspec archive <spec.yaml>           # archive a spec
webspec install [--tools <list>]      # install agent harness files
\`\`\`

Run options: \`--headed\`, \`--browser chromium|firefox|webkit\`,
\`--base-url <url>\`, \`--env KEY=value\`, \`--timeout <ms>\`, \`--retries <n>\`

## Spec format

\`\`\`yaml
name: <string>                # required — human-readable test name
description: <string>         # optional
baseUrl: <string>             # optional — override config baseUrl
env:                          # optional — env vars (use \${VAR} placeholders)
  PASSWORD: \${MY_PASSWORD}

steps:                        # required — at least one step
  - navigate: /path
  - click:
      role: button
      name: Submit
  - assertVisible:
      text: Welcome
\`\`\`

## Selector priority (always use highest available)

1. \`text: "visible label"\`          visible text
2. \`role: button\` + \`name: Submit\`  ARIA role + accessible name
3. \`testid: my-id\`                  data-testid attribute
4. \`label: "Email"\`                 form label
5. \`placeholder: "Enter email"\`     placeholder text
6. \`css: .selector\`                 CSS selector (fallback)
7. \`xpath: //...\`                   XPath (last resort)

Never use \`css\` or \`xpath\` when a semantic alternative exists.

## All 38 commands

### Navigation
- \`navigate: <path|url>\`
- \`reload:\`
- \`goBack:\`
- \`goForward:\`
- \`waitForUrl: <pattern>\`
- \`waitForNetworkIdle:\`

### Interaction
- \`click: <selector>\`
- \`dblClick: <selector>\`
- \`rightClick: <selector>\`
- \`hover: <selector>\`
- \`fill: { <selector>, value: <string> }\`
- \`type: { <selector>, value: <string> }\`        # types char-by-char
- \`clear: <selector>\`
- \`check: <selector>\`
- \`uncheck: <selector>\`
- \`selectOption: { <selector>, value: <string> }\`
- \`uploadFile: { <selector>, path: <string> }\`
- \`press: { <selector>, key: <string> }\`
- \`focus: <selector>\`
- \`blur: <selector>\`
- \`scroll: { <selector>, direction: up|down|left|right, amount: <px> }\`
- \`dragAndDrop: { source: <selector>, target: <selector> }\`

### Assertions
- \`assertVisible: <selector>\`
- \`assertHidden: <selector>\`
- \`assertEnabled: <selector>\`
- \`assertDisabled: <selector>\`
- \`assertChecked: <selector>\`
- \`assertText: { <selector>, value: <string> }\`
- \`assertValue: { <selector>, value: <string> }\`
- \`assertUrl: <pattern>\`
- \`assertTitle: <string>\`
- \`assertCount: { <selector>, count: <number> }\`
- \`assertAttribute: { <selector>, attr: <string>, value: <string> }\`

### Utilities
- \`wait: <ms>\`
- \`screenshot: <filename>\`
- \`evaluate: <js expression>\`        # last resort only
- \`runFlow: <path-to-flow.yaml>\`
- \`setViewport: { width: <px>, height: <px> }\`
- \`log: <message>\`

## Rules

1. Every spec needs \`name:\` and \`steps:\` (minimum one step).
2. After every navigation or form submit, assert the expected outcome.
3. Never hardcode secrets — use \`\${ENV_VAR}\` and list required vars.
4. Use \`runFlow:\` to share repeated setup (login, navigation).
5. Only use \`evaluate:\` as a last resort; explain why no built-in covers it.
6. WebSpec is **web-only** — refuse iOS/Android/native-app requests.

## Mobile refusal

If the user asks about native mobile (iOS, Android, React Native, Expo,
Flutter, Xcode, ADB, APK, IPA), respond:

> "WebSpec is a web-only framework that automates browsers (Chrome, Firefox,
> Safari) via Playwright. For native mobile automation use Maestro or Appium.
> If you want to test a mobile-responsive website in a mobile viewport, I can
> help with that."
`;

// ---------------------------------------------------------------------------
// Command definitions (shared across all harnesses)
// ---------------------------------------------------------------------------

const COMMANDS: CommandDef[] = [
  {
    id: 'run',
    description: 'Run a WebSpec spec file against a browser',
    body: `Run the WebSpec spec at the path provided (or described) by the user.

Steps:
1. Identify the spec file path from $ARGUMENTS (or ask the user).
2. Run: \`webspec run <spec-path>\`
3. If errors occur, read the output and suggest fixes.
4. If the spec does not exist yet, offer to draft it first using /webspec:draft.
`,
  },
  {
    id: 'draft',
    description: 'Draft a new .spec.yaml from a plain-language description',
    body: `Draft a new WebSpec spec file from the user's description.

Input: $ARGUMENTS (description of the flow to automate)

Steps:
1. Classify the intent — if it mentions iOS/Android/native, refuse (see SKILL.md).
2. Extract the target URL from the description, or ask the user for it.
3. Draft a valid \`.spec.yaml\` using the spec format and selector priority rules
   from the SKILL.md installed in this repo.
4. Present the YAML to the user for review.
5. Ask for a file path (default: \`tests/specs/<slug>.spec.yaml\`).
6. Write the file: \`webspec generate --content '<yaml>' --out <path>\`
7. Offer to run it: \`webspec run <path>\`
`,
  },
  {
    id: 'validate',
    description: 'Validate a .spec.yaml for schema and syntax errors',
    body: `Validate a WebSpec spec file.

Steps:
1. Identify the spec file path from $ARGUMENTS (or ask the user).
2. Run: \`webspec validate <spec-path>\`
3. If validation fails, read the errors and suggest fixes.
4. If validation passes, confirm to the user and offer to run the spec.
`,
  },
  {
    id: 'inspect',
    description: 'Inspect a URL and suggest a WebSpec spec',
    body: `Inspect a live URL and suggest a WebSpec spec for it.

Steps:
1. Extract the URL from $ARGUMENTS (or ask the user).
2. Run: \`webspec inspect --url <url>\`
3. Present the suggested spec YAML to the user.
4. Offer to refine and save it: \`webspec generate --content '<yaml>' --out <path>\`
`,
  },
];

// ---------------------------------------------------------------------------
// Harness definitions
// ---------------------------------------------------------------------------

function codexPromptsDir(): string {
  const home = process.env['CODEX_HOME'] ?? path.join(os.homedir(), '.codex');
  return path.join(home, 'prompts');
}

export const HARNESSES: Record<HarnessId, HarnessDef> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    skillPath(cwd: string): string {
      return path.join(cwd, '.claude', 'skills', 'webspec', 'SKILL.md');
    },
    commandPath(cwd: string, commandId: string): string {
      return path.join(cwd, '.claude', 'commands', 'webspec', `${commandId}.md`);
    },
    invocation(commandId: string): string {
      return `/webspec:${commandId}`;
    },
  },

  codex: {
    id: 'codex',
    name: 'Codex',
    skillPath(cwd: string): string {
      return path.join(cwd, '.codex', 'skills', 'webspec', 'SKILL.md');
    },
    commandPath(_cwd: string, commandId: string): string {
      return path.join(codexPromptsDir(), `webspec-${commandId}.md`);
    },
    invocation(commandId: string): string {
      return `webspec-${commandId}`;
    },
  },

  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    skillPath(cwd: string): string {
      return path.join(cwd, '.opencode', 'skills', 'webspec', 'SKILL.md');
    },
    commandPath(cwd: string, commandId: string): string {
      return path.join(cwd, '.opencode', 'commands', `webspec-${commandId}.md`);
    },
    invocation(commandId: string): string {
      return `/webspec-${commandId}`;
    },
  },
};

export const ALL_HARNESS_IDS: HarnessId[] = ['claude', 'codex', 'opencode'];

/**
 * Build the full markdown content for a command file.
 *
 * Format:
 * ```
 * ---
 * description: <one-liner>
 * ---
 * <prompt body>
 * ```
 */
export function buildCommandContent(cmd: CommandDef): string {
  return `---\ndescription: ${cmd.description}\n---\n${cmd.body}`;
}

export { COMMANDS };
