/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SlashCommand {
  command: string;
  description: string;
  usage?: string;
  hint?: string; // Placeholder hint text shown after the command
  handler: (args: string) => Promise<string> | string;
}

class SlashCommandRegistry {
  private commands: Map<string, SlashCommand> = new Map();

  register(command: SlashCommand) {
    if (this.commands.has(command.command)) {
      // eslint-disable-next-line no-console
      console.warn(`Slash command "/${command.command}" is already registered.`);
      return;
    }
    this.commands.set(command.command, command);
  }

  unregister(commandName: string) {
    this.commands.delete(commandName);
  }

  get(commandName: string): SlashCommand | undefined {
    return this.commands.get(commandName);
  }

  getAll(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  getSuggestions(input: string): SlashCommand[] {
    if (!input.startsWith('/')) return [];

    const query = input.slice(1).toLowerCase();
    return this.getAll().filter((cmd) => cmd.command.toLowerCase().startsWith(query));
  }

  async execute(input: string): Promise<{ handled: boolean; message?: string }> {
    if (!input.startsWith('/')) {
      return { handled: false };
    }

    const parts = input.slice(1).split(' ');
    const commandName = parts[0];
    const args = parts.slice(1).join(' ');

    const command = this.get(commandName);
    if (!command) {
      return { handled: false };
    }

    try {
      const message = await command.handler(args);
      return { handled: true, message };
    } catch (error) {
      return {
        handled: true,
        message: `Error executing /${commandName}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }
}

export const slashCommandRegistry = new SlashCommandRegistry();
