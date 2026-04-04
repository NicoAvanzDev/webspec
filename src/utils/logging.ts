/**
 * Structured logging for WebSpec CLI and runtime.
 * Uses chalk for terminal colour; respects NO_COLOR and CI env vars.
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

/** Set LOG_LEVEL=debug to enable debug output. */
const isDebug = process.env['LOG_LEVEL'] === 'debug';

/** Suppress colour when NO_COLOR is set or stdout is not a TTY (e.g. CI). */
const useColour = process.stdout.isTTY && !process.env['NO_COLOR'];

function coloured(text: string): typeof chalk {
  return useColour ? chalk : { ...chalk, ...Object.fromEntries(Object.keys(chalk).map((k) => [k, (s: string) => s])) } as unknown as typeof chalk;
}

const c = useColour ? chalk : {
  gray: (s: string): string => s,
  blue: (s: string): string => s,
  yellow: (s: string): string => s,
  red: (s: string): string => s,
  green: (s: string): string => s,
  bold: (s: string): string => s,
  dim: (s: string): string => s,
  cyan: (s: string): string => s,
  white: (s: string): string => s,
} as unknown as typeof chalk;

void coloured; // suppress unused warning

function prefix(level: LogLevel): string {
  switch (level) {
    case 'debug':   return c.gray('[debug]');
    case 'info':    return c.blue('[info]');
    case 'warn':    return c.yellow('[warn]');
    case 'error':   return c.red('[error]');
    case 'success': return c.green('[ok]');
  }
}

export const logger = {
  debug(msg: string, ...args: unknown[]): void {
    if (!isDebug) return;
    process.stderr.write(`${prefix('debug')} ${msg}\n`);
    if (args.length > 0) process.stderr.write(JSON.stringify(args, null, 2) + '\n');
  },

  info(msg: string): void {
    process.stdout.write(`${prefix('info')} ${msg}\n`);
  },

  warn(msg: string): void {
    process.stderr.write(`${prefix('warn')} ${c.yellow(msg)}\n`);
  },

  error(msg: string): void {
    process.stderr.write(`${prefix('error')} ${c.red(msg)}\n`);
  },

  success(msg: string): void {
    process.stdout.write(`${prefix('success')} ${c.green(msg)}\n`);
  },

  /** Print a plain line without a prefix (e.g. for dividers/headers). */
  plain(msg: string): void {
    process.stdout.write(msg + '\n');
  },

  /** Print step pass/fail lines during a run. */
  step(status: 'pass' | 'fail' | 'skip', description: string, durationMs?: number): void {
    const dur = durationMs !== undefined ? c.dim(` (${durationMs}ms)`) : '';
    if (status === 'pass') {
      process.stdout.write(`  ${c.green('✓')} ${description}${dur}\n`);
    } else if (status === 'fail') {
      process.stderr.write(`  ${c.red('✗')} ${c.red(description)}${dur}\n`);
    } else {
      process.stdout.write(`  ${c.gray('–')} ${c.gray(description)} (skipped)\n`);
    }
  },

  /** Divider / section header. */
  section(title: string): void {
    process.stdout.write(`\n${c.bold(c.cyan(title))}\n${c.dim('─'.repeat(50))}\n`);
  },
};
