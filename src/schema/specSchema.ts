/**
 * Zod schema for .spec.yaml files.
 * Validates the top-level structure and all step commands.
 */

import { z } from 'zod';
import { StepSchema } from './commandSchemas/index';

export const ViewportSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const SpecFileSchema = z.object({
  name: z.string().min(1, 'Spec name is required'),
  description: z.string().optional(),
  baseUrl: z.string().url().or(z.string().startsWith('/')).optional(),
  browser: z.enum(['chromium', 'firefox', 'webkit']).optional(),
  viewport: ViewportSchema.optional(),
  headless: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  steps: z.array(StepSchema).min(1, 'At least one step is required'),
});

export type SpecFileSchemaType = z.infer<typeof SpecFileSchema>;

/**
 * Validates raw YAML-parsed data against the spec schema.
 * Returns a typed result with user-friendly error messages.
 */
export function validateSpecSchema(
  raw: unknown,
  sourcePath?: string,
): { success: true; data: SpecFileSchemaType } | { success: false; errors: string[] } {
  const result = SpecFileSchema.safeParse(raw);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    const location = sourcePath ? `${sourcePath} → ${path}` : path;
    return `[${location}] ${issue.message}`;
  });

  return { success: false, errors };
}
