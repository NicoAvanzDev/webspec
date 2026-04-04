/**
 * Agent harness contract types and helpers.
 *
 * These types define the pseudo-API surface that an LLM agent / harness
 * should use when integrating with WebSpec.
 *
 * Workflow:
 *   1. classifyIntent(userInput) → webspec | mobile-rejected | other
 *   2. draftSpec(userInput, context) → yaml string
 *   3. applySpec(yaml, outputPath) → CLI invocation args
 *   4. (optionally) runSpec(specPath) → CLI invocation args
 */

import type { SpecFile } from '../types/spec';

// ---------------------------------------------------------------------------
// Step 1: Intent
// ---------------------------------------------------------------------------

export type { IntentClassification } from './intent';
export { classifyIntent, extractBaseUrl, buildMobileRefusal } from './intent';

// ---------------------------------------------------------------------------
// Step 2: Draft spec
// ---------------------------------------------------------------------------

export interface DraftSpecContext {
  /** Current working directory of the project. */
  cwd: string;
  /** Base URL of the site being tested, if known. */
  baseUrl?: string;
  /** Any existing webspec.config.yaml values. */
  configEnv?: Record<string, string>;
}

export interface DraftedSpec {
  yaml: string;
  spec: SpecFile;
  suggestedPath: string;
}

// ---------------------------------------------------------------------------
// Step 3: Apply spec via CLI
// ---------------------------------------------------------------------------

export interface ApplySpecArgs {
  /** Absolute or cwd-relative output path. */
  outputPath: string;
  /** The YAML content to write. */
  yamlContent: string;
  /** Whether to overwrite if the file already exists. */
  force?: boolean;
  /** If true, only validate + show diff; do not write. */
  dryRun?: boolean;
}

/**
 * Build the CLI command string to apply a spec.
 */
export function buildApplyCommand(args: ApplySpecArgs): string {
  const parts = ['webspec', 'generate'];
  parts.push(`--output "${args.outputPath}"`);
  if (args.force) parts.push('--force');
  if (args.dryRun) parts.push('--dry-run');
  // Content is passed via stdin or a temp file in practice
  // The agent should write the YAML to a temp file and pass --content @file
  // or pipe it: echo "<yaml>" | webspec generate --output <path>
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Step 4: Run spec via CLI
// ---------------------------------------------------------------------------

export interface RunSpecArgs {
  specPath: string;
  headed?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
  env?: Record<string, string>;
}

/**
 * Build the CLI command string to run a spec.
 */
export function buildRunCommand(args: RunSpecArgs): string {
  const parts = ['webspec', 'run', `"${args.specPath}"`];
  if (args.headed) parts.push('--headed');
  if (args.browser) parts.push(`--browser ${args.browser}`);
  if (args.env) {
    for (const [k, v] of Object.entries(args.env)) {
      parts.push(`--env ${k}=${v}`);
    }
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Harness response helpers
// ---------------------------------------------------------------------------

export interface HarnessProposal {
  specYaml: string;
  outputPath: string;
  cliCommand: string;
  message: string;
}

/**
 * Build a proposal object for the agent to present to the user before applying.
 */
export function buildProposal(
  specYaml: string,
  outputPath: string,
  force = false,
): HarnessProposal {
  return {
    specYaml,
    outputPath,
    cliCommand: `webspec generate --output "${outputPath}"${force ? ' --force' : ''} --content <yaml>`,
    message:
      `I've drafted the following spec at \`${outputPath}\`.\n\n` +
      `Review it, then confirm to apply (or say "apply" to write immediately).`,
  };
}
