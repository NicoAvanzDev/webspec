/**
 * Glob utility for file pattern matching.
 */

import fg from 'fast-glob';
import { exists, isFile } from './filesystem';

/**
 * Find files matching a glob pattern.
 */
export async function glob(pattern: string, cwd: string): Promise<string[]> {
  const entries = await fg(pattern, {
    cwd,
    absolute: true,
    onlyFiles: true,
  });
  return entries.sort();
}

/**
 * Resolve spec paths from input (file, directory, or glob pattern).
 */
export async function resolveSpecPaths(inputPath: string, cwd: string): Promise<string[]> {
  const absolutePath = inputPath.startsWith('/') ? inputPath : `${cwd}/${inputPath}`;

  // Single file
  if (exists(absolutePath) && isFile(absolutePath)) {
    return [absolutePath];
  }

  // Glob pattern
  if (inputPath.includes('*') || inputPath.includes('?')) {
    return glob(inputPath, cwd);
  }

  // Default to spec files in the path
  const pattern = `${inputPath}/**/*.spec.yaml`;
  return glob(pattern, cwd);
}
