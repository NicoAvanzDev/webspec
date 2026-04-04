/**
 * File-system utilities for WebSpec.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Read a file as UTF-8 text; throws with a clear message if missing.
 */
export function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw err;
  }
}

/**
 * Write text to a file, creating parent directories as needed.
 * If `force` is false and the file exists, throws.
 */
export function writeFile(filePath: string, content: string, force = false): void {
  if (!force && fs.existsSync(filePath)) {
    throw new Error(
      `File already exists: ${filePath}\nUse --force to overwrite or choose a different output path.`,
    );
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Create a directory (and all parents) if it does not exist.
 */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Check whether a path exists (file or directory).
 */
export function exists(p: string): boolean {
  return fs.existsSync(p);
}

/**
 * Check whether a path is a directory.
 */
export function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check whether a path is a file.
 */
export function isFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * List all files in a directory matching a glob pattern.
 */
export async function glob(pattern: string, cwd: string): Promise<string[]> {
  const { default: fastGlob } = await import('fast-glob');
  const results = await fastGlob(pattern, { cwd, absolute: true });
  return results.sort();
}

/**
 * Resolve spec files from a path argument.
 * - If path is a file: return [file]
 * - If path is a directory: return all *.spec.yaml files within
 * - If path is a glob: expand it
 */
export async function resolveSpecPaths(inputPath: string, cwd: string): Promise<string[]> {
  const absolute = path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath);

  if (isFile(absolute)) return [absolute];

  if (isDirectory(absolute)) {
    return glob('**/*.spec.{yaml,yml}', absolute);
  }

  // Treat as glob pattern
  return glob(inputPath, cwd);
}
