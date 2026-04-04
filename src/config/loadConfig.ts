/**
 * Load webspec.config.yaml by searching upward from cwd.
 * Returns the parsed config object and the path it was loaded from.
 */

import * as path from 'path';
import * as fs from 'fs';
import { parseYamlObject } from '../utils/yaml';
import { validateConfigSchema } from '../schema/configSchema';
import type { WebSpecConfig } from '../types/config';
import { ConfigError } from '../utils/errors';

const CONFIG_FILE_NAMES = ['webspec.config.yaml', 'webspec.config.yml'];

/**
 * Walk up from `startDir` looking for a config file.
 * Returns `{ config, configFilePath }` or `{ config: {}, configFilePath: undefined }`
 * if no config is found.
 */
export function loadConfig(
  startDir: string,
  explicitPath?: string,
): { config: WebSpecConfig; configFilePath?: string } {
  const configFilePath = explicitPath
    ? path.resolve(startDir, explicitPath)
    : findConfigFile(startDir);

  if (!configFilePath) {
    return { config: {} };
  }

  if (!fs.existsSync(configFilePath)) {
    throw new ConfigError(`Config file not found: ${configFilePath}`);
  }

  const raw = fs.readFileSync(configFilePath, 'utf-8');
  const obj = parseYamlObject(raw, configFilePath);
  const result = validateConfigSchema(obj, configFilePath);

  if (!result.success) {
    throw new ConfigError(
      [`Invalid config file: ${configFilePath}`, ...result.errors].join('\n'),
    );
  }

  return { config: result.data as WebSpecConfig, configFilePath };
}

function findConfigFile(startDir: string): string | undefined {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);

  while (dir !== root) {
    for (const name of CONFIG_FILE_NAMES) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return undefined;
}
