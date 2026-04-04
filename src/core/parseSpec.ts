/**
 * Parse a .spec.yaml file from disk into a validated SpecFile.
 */

import * as path from 'path';
import { readFile } from '../utils/fs';
import { parseYamlObject } from '../utils/yaml';
import { validateSpecSchema } from '../schema/specSchema';
import { ValidationError } from '../utils/errors';
import type { SpecFile } from '../types/spec';

/**
 * Read and validate a spec file from disk.
 * Throws ValidationError if the file is invalid.
 */
export function parseSpec(filePath: string): SpecFile {
  const absolutePath = path.resolve(filePath);
  const raw = readFile(absolutePath);
  const obj = parseYamlObject(raw, absolutePath);
  const result = validateSpecSchema(obj, absolutePath);

  if (!result.success) {
    throw new ValidationError(
      `Spec validation failed: ${absolutePath}`,
      result.errors,
    );
  }

  return result.data as SpecFile;
}

/**
 * Parse a spec from a YAML string (not a file path).
 * Useful for `webspec generate --content` validation and tests.
 */
export function parseSpecFromString(yamlContent: string, sourceName = '<inline>'): SpecFile {
  const obj = parseYamlObject(yamlContent, sourceName);
  const result = validateSpecSchema(obj, sourceName);

  if (!result.success) {
    throw new ValidationError(`Spec validation failed: ${sourceName}`, result.errors);
  }

  return result.data as SpecFile;
}
