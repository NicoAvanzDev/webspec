/**
 * Interface layer exports.
 *
 * The interface layer contains:
 * - CLI: Command-line interface commands
 * - Runtime: Command execution and reporters
 */

// Runtime
export type { ExecutionContext } from "./runtime/context";
export { buildUrl, captureScreenshot } from "./runtime/context";
export { COMMAND_REGISTRY, getCommandKey, getSupportedCommands } from "./runtime/commands/index";
export type { CommandEntry } from "./runtime/commands/index";

// Reporters
export type { Reporter } from "./reporters/console";
export { ConsoleReporter, JsonReporter, MultiReporter } from "./reporters/console";
