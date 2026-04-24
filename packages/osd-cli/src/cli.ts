/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadConfig } from './config';
import { initCommand } from './commands/init';
import { buildCommand } from './commands/build';
import { validateCommand } from './commands/validate';
import { diffCommand } from './commands/diff';
import { applyCommand } from './commands/apply';
import { pullCommand, parseLabels } from './commands/pull';
import { lintCommand } from './commands/lint';
import { printError } from './utils/output';

const VERSION = '0.1.0';

const COMMANDS = ['init', 'build', 'validate', 'diff', 'apply', 'pull', 'lint', 'preview'];

interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
  positional: string[];
}

/**
 * Hand-rolled argument parser. No external dependencies.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  let command = '';

  let i = 0;

  // First non-flag argument is the command
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      flags['help'] = true;
      i++;
      continue;
    }

    if (arg === '--version' || arg === '-v') {
      flags['version'] = true;
      i++;
      continue;
    }

    if (!arg.startsWith('-') && !command) {
      command = arg;
      i++;
      continue;
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const eqIndex = key.indexOf('=');
      if (eqIndex !== -1) {
        flags[key.slice(0, eqIndex)] = key.slice(eqIndex + 1);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        // Peek: if the next arg looks like a value, consume it
        // But some flags are boolean (dry-run, confirm, stdout, server, help, version)
        const booleanFlags = ['dry-run', 'confirm', 'stdout', 'server', 'help', 'version'];
        if (booleanFlags.includes(key)) {
          flags[key] = true;
        } else {
          flags[key] = argv[i + 1];
          i++;
        }
      } else {
        flags[key] = true;
      }
      i++;
      continue;
    }

    if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.slice(1);
      // Short boolean flags
      if (key === 'h') {
        flags['help'] = true;
        i++;
        continue;
      }
      if (key === 'v') {
        flags['version'] = true;
        i++;
        continue;
      }
      // Short flags with values
      if (i + 1 < argv.length) {
        flags[key] = argv[i + 1];
        i += 2;
        continue;
      }
      flags[key] = true;
      i++;
      continue;
    }

    positional.push(arg);
    i++;
  }

  return { command, flags, positional };
}

function printHelp(): void {
  console.log(`
osdctl - CLI tool for OpenSearch Dashboards as Code

VERSION
  ${VERSION}

USAGE
  osdctl <command> [options]

COMMANDS
  init        Scaffold a new Dashboards-as-Code project
  build       Build SDK source (TypeScript) to JSON/YAML
  validate    Validate dashboard definitions
  diff        Diff local definitions against deployed versions
  apply       Deploy dashboard definitions to an instance
  pull        Pull dashboards from a running instance
  lint        Lint dashboard definitions against rules
  preview     Preview dashboards (coming soon)

GLOBAL OPTIONS
  --help, -h       Show help
  --version, -v    Show version
  --profile        Select a configuration profile

Run 'osdctl <command> --help' for command-specific help.
`);
}

function printCommandHelp(command: string): void {
  const helps: Record<string, string> = {
    init: `
osdctl init [directory] [options]

  Scaffold a new Dashboards-as-Code project.

  OPTIONS
    --language, -l   Language for SDK (typescript, python, go, java) [default: typescript]
`,
    build: `
osdctl build [options]

  Build TypeScript source files to JSON/YAML.

  OPTIONS
    -f <file>        Build a single file
    -d <directory>   Build all files in a directory
    -o <format>      Output format: json or yaml [default: yaml]
    --output-dir     Output directory [default: ./built]
    --stdout         Print output to stdout instead of writing files
`,
    validate: `
osdctl validate [options]

  Validate dashboard definitions.

  OPTIONS
    --input-dir      Input directory [default: ./built]
    --server         Validate against the server API
`,
    diff: `
osdctl diff [options]

  Compare local definitions against deployed versions.

  EXIT CODES
    0    No drift detected (all resources unchanged)
    1    Error (network failure, auth error, invalid input)
    2    Drift detected (at least one resource is new or updated)

  OPTIONS
    --input-dir          Input directory [default: ./built]
    --output-dir         Write .diff files to this directory
    --output, -o <mode>  Output mode: text or json [default: text]
`,
    apply: `
osdctl apply [options]

  Deploy dashboard definitions to an OpenSearch Dashboards instance.

  OPTIONS
    --input-dir      Input directory [default: ./built]
    --dry-run        Preview changes without applying
    --confirm        Prompt for confirmation before applying
`,
    pull: `
osdctl pull [options]

  Pull dashboards from a running instance.

  OPTIONS
    --output-dir     Output directory [default: ./pulled]
    -o <format>      Output format: json or yaml [default: yaml]
    --label          Filter by labels (format: key=value,key2=value2)
    --per-page       Number of objects per page for pagination [default: 100]
`,
    lint: `
osdctl lint [options]

  Lint dashboard definitions against configured rules.

  OPTIONS
    --input-dir      Input directory [default: ./built]
`,
    preview: `
osdctl preview

  Preview dashboards locally. (Coming soon)
`,
  };

  console.log(helps[command] || `No help available for command: ${command}`);
}

/**
 * Main entry point for the CLI.
 */
export async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);

  if (parsed.flags['version']) {
    console.log(`osdctl version ${VERSION}`);
    return;
  }

  if (parsed.flags['help'] && !parsed.command) {
    printHelp();
    return;
  }

  if (!parsed.command) {
    printHelp();
    return;
  }

  if (parsed.flags['help']) {
    printCommandHelp(parsed.command);
    return;
  }

  if (!COMMANDS.includes(parsed.command)) {
    printError(`Unknown command: "${parsed.command}". Run 'osdctl --help' for available commands.`);
    process.exitCode = 1;
    return;
  }

  const profileName = parsed.flags['profile'] as string | undefined;

  try {
    switch (parsed.command) {
      case 'init': {
        const directory = parsed.positional[0] || (parsed.flags['d'] as string) || '.';
        const language = (parsed.flags['language'] as string) || (parsed.flags['l'] as string) || 'typescript';
        await initCommand({ directory, language });
        break;
      }

      case 'build': {
        const config = loadConfig(profileName);
        await buildCommand({
          file: parsed.flags['f'] as string | undefined,
          directory: (parsed.flags['d'] as string) || undefined,
          outputFormat: ((parsed.flags['o'] as string) || 'yaml') as 'json' | 'yaml',
          outputDir: (parsed.flags['output-dir'] as string) || config.outputDir,
          stdout: parsed.flags['stdout'] === true,
          config,
        });
        break;
      }

      case 'validate': {
        const config = loadConfig(profileName);
        await validateCommand({
          inputDir: (parsed.flags['input-dir'] as string) || config.outputDir,
          server: parsed.flags['server'] === true,
          config,
        });
        break;
      }

      case 'diff': {
        const config = loadConfig(profileName);
        await diffCommand({
          inputDir: (parsed.flags['input-dir'] as string) || config.outputDir,
          outputDir: (parsed.flags['output-dir'] as string) || undefined,
          output: ((parsed.flags['output'] as string) || (parsed.flags['o'] as string) || 'text') as 'text' | 'json',
          config,
        });
        break;
      }

      case 'apply': {
        const config = loadConfig(profileName);
        await applyCommand({
          inputDir: (parsed.flags['input-dir'] as string) || config.outputDir,
          dryRun: parsed.flags['dry-run'] === true,
          confirm: parsed.flags['confirm'] === true,
          config,
        });
        break;
      }

      case 'pull': {
        const config = loadConfig(profileName);
        const labelStr = parsed.flags['label'] as string | undefined;
        const perPageStr = parsed.flags['per-page'] as string | undefined;
        const perPage = perPageStr ? parseInt(perPageStr, 10) : 100;
        await pullCommand({
          outputDir: (parsed.flags['output-dir'] as string) || './pulled',
          outputFormat: ((parsed.flags['o'] as string) || 'yaml') as 'json' | 'yaml',
          labels: labelStr ? parseLabels(labelStr) : undefined,
          perPage,
          config,
        });
        break;
      }

      case 'lint': {
        const config = loadConfig(profileName);
        await lintCommand({
          inputDir: (parsed.flags['input-dir'] as string) || config.outputDir,
          config,
        });
        break;
      }

      case 'preview': {
        console.log('Preview command is coming soon.');
        break;
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    printError(error.message);
    process.exitCode = 1;
  }
}
