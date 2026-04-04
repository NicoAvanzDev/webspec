/**
 * Path resolution utilities for WebSpec.
 */

import * as path from 'path';
import * as fs from 'fs';

/**
 * Find the project root by walking up from `startDir` until
 * webspec.config.yaml or package.json is found.
 * Returns undefined if not found.
 */
export function findProjectRoot(startDir: string): string | undefined {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);

  while (dir !== root) {
    if (
      fs.existsSync(path.join(dir, 'webspec.config.yaml')) ||
      fs.existsSync(path.join(dir, 'package.json'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return undefined;
}

/**
 * Resolve a path that may be relative (to `relativeTo`) or absolute.
 */
export function resolvePath(p: string, relativeTo: string): string {
  if (path.isAbsolute(p)) return p;
  return path.resolve(relativeTo, p);
}

/**
 * Ensure a path uses forward slashes (cosmetic, for display).
 */
export function toForwardSlashes(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Make `target` path relative to `base`, using forward slashes.
 */
export function relativePosix(base: string, target: string): string {
  return toForwardSlashes(path.relative(base, target));
}

/**
 * Ensure a file path has the `.spec.yaml` extension.
 */
export function ensureSpecExtension(filePath: string): string {
  if (filePath.endsWith('.spec.yaml') || filePath.endsWith('.spec.yml')) return filePath;
  return filePath + '.spec.yaml';
}

/**
 * Derive a spec name from a file path (basename without extension).
 */
export function specNameFromPath(filePath: string): string {
  const base = path.basename(filePath);
  return base.replace(/\.spec\.(yaml|yml)$/, '').replace(/\.yaml$/, '').replace(/\.yml$/, '');
}

/**
 * Slugify a human string to a safe filename.
 * "Login Test - Happy Path" → "login-test-happy-path"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
