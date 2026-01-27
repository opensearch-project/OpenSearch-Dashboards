/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SlashCommand, slashCommandRegistry } from './slash_commands';

/**
 * Service for managing slash command registration from external plugins
 */
export interface CommandRegistrySetup {
  /**
   * Register a slash command that will be available in the chat interface
   * @param command - The slash command configuration
   * @returns A function to unregister the command
   */
  registerCommand: (command: SlashCommand) => () => void;
}

export class CommandRegistryService {
  public setup(): CommandRegistrySetup {
    return {
      registerCommand: (command: SlashCommand) => {
        slashCommandRegistry.register(command);

        // Return unregister function
        return () => {
          slashCommandRegistry.unregister(command.command);
        };
      },
    };
  }
}
