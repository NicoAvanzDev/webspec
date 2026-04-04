/**
 * File installation logic for `webspec install`.
 *
 * Writes SKILL.md and slash-command files for each requested harness.
 * Always overwrites — the files are fully managed by WebSpec.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  HARNESSES,
  SKILL_MD,
  COMMANDS,
  buildCommandContent,
  type HarnessId,
} from './harnesses';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FileStatus = 'installed' | 'updated';

export interface InstalledFile {
  /** Absolute path of the written file. */
  filePath: string;
  /** Whether the file was newly created or overwritten. */
  status: FileStatus;
}

export interface HarnessInstallResult {
  harnessId: HarnessId;
  harnesName: string;
  files: InstalledFile[];
}

export interface InstallResult {
  harnesses: HarnessInstallResult[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Write `content` to `filePath`, creating parent directories as needed.
 * Returns whether the file was newly created ('installed') or overwritten ('updated').
 */
function writeManaged(filePath: string, content: string): FileStatus {
  const existed = fs.existsSync(filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return existed ? 'updated' : 'installed';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Install skill and command files for the given harnesses into `cwd`.
 */
export function installHarnesses(
  harnessIds: HarnessId[],
  cwd: string,
): InstallResult {
  const results: HarnessInstallResult[] = [];

  for (const id of harnessIds) {
    const harness = HARNESSES[id];
    const files: InstalledFile[] = [];

    // SKILL.md
    const skillFilePath = harness.skillPath(cwd);
    const skillStatus = writeManaged(skillFilePath, SKILL_MD);
    files.push({ filePath: skillFilePath, status: skillStatus });

    // One file per command
    for (const cmd of COMMANDS) {
      const cmdFilePath = harness.commandPath(cwd, cmd.id);
      const cmdContent = buildCommandContent(cmd);
      const cmdStatus = writeManaged(cmdFilePath, cmdContent);
      files.push({ filePath: cmdFilePath, status: cmdStatus });
    }

    results.push({ harnessId: id, harnesName: harness.name, files });
  }

  return { harnesses: results };
}
