/**
 * Spec parsing service.
 *
 * Parses YAML spec files into the domain SpecFile type.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { SpecFile } from "../../domain/index";
import { ValidationError } from "../../domain/index";
import { parseYaml } from "../../infrastructure/persistence/yaml";

/**
 * Parse a spec file from disk.
 */
export function parseSpec(filePath: string): SpecFile {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new ValidationError(`Spec file not found: ${absolutePath}`, [
      `File does not exist: ${absolutePath}`,
    ]);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  return parseSpecFromString(content, absolutePath);
}

/**
 * Parse spec content from a string.
 */
export function parseSpecFromString(content: string, sourcePath?: string): SpecFile {
  const parsed = parseYaml(content, sourcePath);

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ValidationError(
      sourcePath ? `Invalid spec file: ${sourcePath}` : "Invalid spec content",
      ["Spec must be a YAML object, not an array or primitive"],
    );
  }

  // Basic structure validation before schema validation
  const obj = parsed as Record<string, unknown>;

  if (!("name" in obj) || typeof obj.name !== "string") {
    throw new ValidationError(
      sourcePath ? `Invalid spec file: ${sourcePath}` : "Invalid spec content",
      ['Spec must have a "name" field (string)'],
    );
  }

  if (!("steps" in obj) || !Array.isArray(obj.steps)) {
    throw new ValidationError(
      sourcePath ? `Invalid spec file: ${sourcePath}` : "Invalid spec content",
      ['Spec must have a "steps" field (array)'],
    );
  }

  return parsed as SpecFile;
}
