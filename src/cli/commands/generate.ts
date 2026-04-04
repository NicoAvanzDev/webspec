/**
 * `webspec generate` — write a .spec.yaml file from provided YAML content.
 *
 * Intended for use by agent harnesses:
 *   webspec generate \
 *     --name "login-flow" \
 *     --output tests/specs/login.spec.yaml \
 *     --content "<yaml string>"
 */

import * as path from 'path';
import * as fs from 'fs';
import { createPatch } from 'diff';
import chalk from 'chalk';
import type { Command } from 'commander';
import { parseSpecFromString } from '../../core/parseSpec';
import { writeFile } from '../../utils/fs';
import { stringifyYaml } from '../../utils/yaml';
import { formatError } from '../../utils/errors';
import { logger } from '../../utils/logging';
import { ensureSpecExtension, slugify } from '../../utils/paths';

export interface GenerateOptions {
  name?: string;
  output?: string;
  content?: string;
  stdout?: boolean;
  force?: boolean;
  dryRun?: boolean;
  cwd?: string;
}

export async function generate(opts: GenerateOptions): Promise<void> {
  const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();

  // 1. Get YAML content
  let yamlContent = opts.content ?? '';

  if (!yamlContent && !process.stdin.isTTY) {
    // Read from stdin
    yamlContent = await readStdin();
  }

  if (!yamlContent) {
    logger.error('No spec content provided. Use --content "<yaml>" or pipe YAML via stdin.');
    process.exit(1);
  }

  // 2. Validate the spec
  let spec;
  try {
    spec = parseSpecFromString(yamlContent);
  } catch (err) {
    logger.error(formatError(err));
    process.exit(1);
  }

  // 3. Resolve output path
  let outputPath = opts.output;
  if (!outputPath) {
    const name = opts.name ?? spec.name;
    outputPath = path.join(cwd, 'tests', 'specs', ensureSpecExtension(slugify(name)));
  } else {
    outputPath = path.resolve(cwd, outputPath);
    outputPath = ensureSpecExtension(outputPath);
  }

  // 4. Normalise YAML (re-stringify for consistent formatting)
  const normYaml = stringifyYaml(spec);

  // 5. Handle stdout
  if (opts.stdout) {
    process.stdout.write(normYaml);
    return;
  }

  // 6. Dry run
  if (opts.dryRun) {
    logger.section('Dry run — would write:');
    logger.plain(`  ${chalk.cyan(outputPath)}`);

    if (fs.existsSync(outputPath)) {
      const existing = fs.readFileSync(outputPath, 'utf-8');
      const patch = createPatch(outputPath, existing, normYaml, 'existing', 'new');
      logger.plain('\n' + colourPatch(patch));
    } else {
      logger.plain('\n' + chalk.green(normYaml));
    }
    return;
  }

  // 7. Write file
  try {
    writeFile(outputPath, normYaml, opts.force ?? false);
    logger.success(`Spec written: ${outputPath}`);
    logger.plain(`  Run it with: ${chalk.cyan(`webspec run "${outputPath}"`)}`);
  } catch (err) {
    logger.error(formatError(err));
    process.exit(1);
  }
}

export function registerGenerate(program: Command): void {
  program
    .command('generate')
    .description('Write a .spec.yaml file from provided YAML content (agent-friendly)')
    .option('--name <name>', 'Spec name (used to derive output path if --output not set)')
    .option('--output <path>', 'Output file path (default: tests/specs/<name>.spec.yaml)')
    .option('--content <yaml>', 'YAML content to write (or pipe via stdin)')
    .option('--stdout', 'Print the normalised spec to stdout instead of writing a file')
    .option('--force', 'Overwrite existing file without confirmation')
    .option('--dry-run', 'Validate and show diff without writing')
    .option('--cwd <dir>', 'Working directory')
    .action(async (opts: GenerateOptions) => {
      await generate(opts);
    });
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

function colourPatch(patch: string): string {
  return patch
    .split('\n')
    .map((line) => {
      if (line.startsWith('+')) return chalk.green(line);
      if (line.startsWith('-')) return chalk.red(line);
      if (line.startsWith('@@')) return chalk.cyan(line);
      return line;
    })
    .join('\n');
}
