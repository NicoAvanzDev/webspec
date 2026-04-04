/**
 * Zod schema for webspec.config.yaml.
 */

import { z } from 'zod';

export const ConfigSchema = z.object({
  baseUrl: z.string().optional(),
  browser: z.enum(['chromium', 'firefox', 'webkit']).optional(),
  viewport: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .optional(),
  headless: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
  specsDir: z.string().optional(),
  flowsDir: z.string().optional(),
  screenshotsDir: z.string().optional(),
  artifactsDir: z.string().optional(),
  screenshot: z.enum(['on', 'off', 'only-on-failure']).optional(),
  trace: z.enum(['on', 'off', 'retain-on-failure']).optional(),
  reporters: z.array(z.enum(['console', 'json', 'junit'])).optional(),
  env: z.record(z.string()).optional(),
});

export type ConfigSchemaType = z.infer<typeof ConfigSchema>;

export function validateConfigSchema(
  raw: unknown,
  sourcePath?: string,
): { success: true; data: ConfigSchemaType } | { success: false; errors: string[] } {
  const result = ConfigSchema.safeParse(raw);

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
