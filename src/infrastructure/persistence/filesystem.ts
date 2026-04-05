/**
 * File system persistence adapter.
 *
 * Provides file system operations with error handling.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { ValidationError } from "../../domain/index";

/**
 * Read a file as UTF-8 text.
 */
export function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`Failed to read file: ${filePath}`, [message]);
  }
}

/**
 * Write content to a file.
 */
export function writeFile(filePath: string, content: string, force = false): void {
  if (!force && fs.existsSync(filePath)) {
    throw new ValidationError(`File already exists: ${filePath}`, ["Use force=true to overwrite"]);
  }

  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`Failed to write file: ${filePath}`, [message]);
  }
}

/**
 * Ensure a directory exists (recursive).
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Check if a path exists.
 */
export function exists(p: string): boolean {
  return fs.existsSync(p);
}

/**
 * Check if a path is a directory.
 */
export function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file.
 */
export function isFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}
