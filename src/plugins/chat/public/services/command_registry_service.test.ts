/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandRegistryService } from './command_registry_service';
import { slashCommandRegistry, SlashCommand } from './slash_commands';

describe('CommandRegistryService', () => {
  let service: CommandRegistryService;

  beforeEach(() => {
    service = new CommandRegistryService();
    // Clear any existing commands
    slashCommandRegistry.getAll().forEach((cmd) => {
      slashCommandRegistry.unregister(cmd.command);
    });
  });

  afterEach(() => {
    // Clean up after each test
    slashCommandRegistry.getAll().forEach((cmd) => {
      slashCommandRegistry.unregister(cmd.command);
    });
  });

  describe('setup', () => {
    it('should return a setup object with registerCommand method', () => {
      const setup = service.setup();

      expect(setup).toBeDefined();
      expect(setup.registerCommand).toBeDefined();
      expect(typeof setup.registerCommand).toBe('function');
    });
  });

  describe('registerCommand', () => {
    it('should register a command successfully', () => {
      const setup = service.setup();
      const mockCommand: SlashCommand = {
        command: 'test',
        description: 'Test command',
        handler: jest.fn().mockResolvedValue('Test result'),
      };

      setup.registerCommand(mockCommand);

      const registered = slashCommandRegistry.get('test');
      expect(registered).toBeDefined();
      expect(registered?.command).toBe('test');
      expect(registered?.description).toBe('Test command');
    });

    it('should return an unregister function', () => {
      const setup = service.setup();
      const mockCommand: SlashCommand = {
        command: 'test',
        description: 'Test command',
        handler: jest.fn(),
      };

      const unregister = setup.registerCommand(mockCommand);

      expect(typeof unregister).toBe('function');
      expect(slashCommandRegistry.get('test')).toBeDefined();

      // Call unregister
      unregister();

      expect(slashCommandRegistry.get('test')).toBeUndefined();
    });

    it('should register multiple commands', () => {
      const setup = service.setup();
      const command1: SlashCommand = {
        command: 'cmd1',
        description: 'Command 1',
        handler: jest.fn(),
      };
      const command2: SlashCommand = {
        command: 'cmd2',
        description: 'Command 2',
        handler: jest.fn(),
      };

      setup.registerCommand(command1);
      setup.registerCommand(command2);

      expect(slashCommandRegistry.get('cmd1')).toBeDefined();
      expect(slashCommandRegistry.get('cmd2')).toBeDefined();
      expect(slashCommandRegistry.getAll()).toHaveLength(2);
    });

    it('should handle command with optional properties', () => {
      const setup = service.setup();
      const mockCommand: SlashCommand = {
        command: 'advanced',
        description: 'Advanced command',
        usage: '/advanced [options]',
        hint: 'Enter options',
        handler: jest.fn(),
      };

      setup.registerCommand(mockCommand);

      const registered = slashCommandRegistry.get('advanced');
      expect(registered?.usage).toBe('/advanced [options]');
      expect(registered?.hint).toBe('Enter options');
    });
  });
});
