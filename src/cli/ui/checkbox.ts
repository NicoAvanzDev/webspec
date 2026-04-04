/**
 * Interactive multi-select checkbox prompt.
 *
 * Thin wrapper around inquirer@8 (CJS-compatible).
 * Falls back gracefully when stdin is not a TTY (e.g. CI pipelines).
 */

import inquirer from 'inquirer';

export interface CheckboxChoice {
  name: string;
  value: string;
  checked?: boolean;
}

export interface CheckboxOptions {
  message: string;
  choices: CheckboxChoice[];
}

/**
 * Render an interactive checkbox prompt and return the selected values.
 *
 * @throws {Error} if stdin is not a TTY and no defaults are available
 */
export async function checkbox(opts: CheckboxOptions): Promise<string[]> {
  const { answers } = await inquirer.prompt<{ answers: string[] }>([
    {
      type: 'checkbox',
      name: 'answers',
      message: opts.message,
      choices: opts.choices,
    },
  ]);

  return answers;
}
