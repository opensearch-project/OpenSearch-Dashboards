/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { slashCommandRegistry, SlashCommand } from './slash_commands';

describe('SlashCommandRegistry', () => {
  // Clear all commands before each test to ensure isolation
  beforeEach(() => {
    const allCommands = slashCommandRegistry.getAll();
    allCommands.forEach((cmd) => slashCommandRegistry.unregister(cmd.command));
  });

  describe('register', () => {
    it('should register a command', () => {
      const command: SlashCommand = {
        command: 'test',
        description: 'Test command',
        handler: () => 'test result',
      };

      slashCommandRegistry.register(command);
      expect(slashCommandRegistry.get('test')).toBe(command);
    });

    it('should register multiple commands', () => {
      const command1: SlashCommand = {
        command: 'test1',
        description: 'Test command 1',
        handler: () => 'result 1',
      };

      const command2: SlashCommand = {
        command: 'test2',
        description: 'Test command 2',
        handler: () => 'result 2',
      };

      slashCommandRegistry.register(command1);
      slashCommandRegistry.register(command2);

      expect(slashCommandRegistry.get('test1')).toBe(command1);
      expect(slashCommandRegistry.get('test2')).toBe(command2);
    });

    it('should not overwrite existing command with same name', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const command1: SlashCommand = {
        command: 'test',
        description: 'First version',
        handler: () => 'first',
      };

      const command2: SlashCommand = {
        command: 'test',
        description: 'Second version',
        handler: () => 'second',
      };

      slashCommandRegistry.register(command1);
      slashCommandRegistry.register(command2);

      // Should keep the first command
      expect(slashCommandRegistry.get('test')).toBe(command1);
      expect(slashCommandRegistry.get('test')?.description).toBe('First version');

      // Should have logged a warning
      expect(consoleWarnSpy).toHaveBeenCalledWith('Slash command "/test" is already registered.');

      consoleWarnSpy.mockRestore();
    });

    it('should register command with optional fields', () => {
      const command: SlashCommand = {
        command: 'test',
        description: 'Test command',
        usage: '/test [args]',
        hint: 'Enter arguments',
        handler: () => 'result',
      };

      slashCommandRegistry.register(command);
      const registered = slashCommandRegistry.get('test');

      expect(registered?.usage).toBe('/test [args]');
      expect(registered?.hint).toBe('Enter arguments');
    });

    it('should log warning when registering duplicate command', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const command1: SlashCommand = {
        command: 'duplicate',
        description: 'First',
        handler: () => 'first',
      };

      const command2: SlashCommand = {
        command: 'duplicate',
        description: 'Second',
        handler: () => 'second',
      };

      slashCommandRegistry.register(command1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      slashCommandRegistry.register(command2);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Slash command "/duplicate" is already registered.'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('unregister', () => {
    it('should remove a registered command', () => {
      const command: SlashCommand = {
        command: 'test',
        description: 'Test command',
        handler: () => 'result',
      };

      slashCommandRegistry.register(command);
      expect(slashCommandRegistry.get('test')).toBeDefined();

      slashCommandRegistry.unregister('test');
      expect(slashCommandRegistry.get('test')).toBeUndefined();
    });

    it('should do nothing if command does not exist', () => {
      slashCommandRegistry.unregister('nonexistent');
      // Should not throw
      expect(slashCommandRegistry.get('nonexistent')).toBeUndefined();
    });

    it('should only remove specified command', () => {
      const command1: SlashCommand = {
        command: 'test1',
        description: 'Test 1',
        handler: () => 'result 1',
      };

      const command2: SlashCommand = {
        command: 'test2',
        description: 'Test 2',
        handler: () => 'result 2',
      };

      slashCommandRegistry.register(command1);
      slashCommandRegistry.register(command2);

      slashCommandRegistry.unregister('test1');

      expect(slashCommandRegistry.get('test1')).toBeUndefined();
      expect(slashCommandRegistry.get('test2')).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return registered command', () => {
      const command: SlashCommand = {
        command: 'test',
        description: 'Test command',
        handler: () => 'result',
      };

      slashCommandRegistry.register(command);
      expect(slashCommandRegistry.get('test')).toBe(command);
    });

    it('should return undefined for non-existent command', () => {
      expect(slashCommandRegistry.get('nonexistent')).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const command: SlashCommand = {
        command: 'test',
        description: 'Test command',
        handler: () => 'result',
      };

      slashCommandRegistry.register(command);
      expect(slashCommandRegistry.get('test')).toBeDefined();
      expect(slashCommandRegistry.get('Test')).toBeUndefined();
      expect(slashCommandRegistry.get('TEST')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return empty array when no commands registered', () => {
      expect(slashCommandRegistry.getAll()).toEqual([]);
    });

    it('should return all registered commands', () => {
      const command1: SlashCommand = {
        command: 'test1',
        description: 'Test 1',
        handler: () => 'result 1',
      };

      const command2: SlashCommand = {
        command: 'test2',
        description: 'Test 2',
        handler: () => 'result 2',
      };

      const command3: SlashCommand = {
        command: 'test3',
        description: 'Test 3',
        handler: () => 'result 3',
      };

      slashCommandRegistry.register(command1);
      slashCommandRegistry.register(command2);
      slashCommandRegistry.register(command3);

      const all = slashCommandRegistry.getAll();
      expect(all.length).toBe(3);
      expect(all).toContain(command1);
      expect(all).toContain(command2);
      expect(all).toContain(command3);
    });

    it('should return a new array each time', () => {
      const command: SlashCommand = {
        command: 'test',
        description: 'Test',
        handler: () => 'result',
      };

      slashCommandRegistry.register(command);

      const all1 = slashCommandRegistry.getAll();
      const all2 = slashCommandRegistry.getAll();

      expect(all1).not.toBe(all2);
      expect(all1).toEqual(all2);
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      slashCommandRegistry.register({
        command: 'help',
        description: 'Show help',
        handler: () => 'help text',
      });

      slashCommandRegistry.register({
        command: 'hello',
        description: 'Say hello',
        handler: () => 'Hello!',
      });

      slashCommandRegistry.register({
        command: 'history',
        description: 'Show history',
        handler: () => 'history',
      });

      slashCommandRegistry.register({
        command: 'clear',
        description: 'Clear chat',
        handler: () => 'cleared',
      });
    });

    it('should return empty array for non-slash input', () => {
      expect(slashCommandRegistry.getSuggestions('test')).toEqual([]);
      expect(slashCommandRegistry.getSuggestions('hello')).toEqual([]);
      expect(slashCommandRegistry.getSuggestions('')).toEqual([]);
    });

    it('should return all commands for "/" input', () => {
      const suggestions = slashCommandRegistry.getSuggestions('/');
      expect(suggestions.length).toBe(4);
    });

    it('should return matching commands for partial input', () => {
      const suggestions = slashCommandRegistry.getSuggestions('/he');
      expect(suggestions.length).toBe(2);
      expect(suggestions.map((s) => s.command)).toContain('help');
      expect(suggestions.map((s) => s.command)).toContain('hello');
    });

    it('should return single matching command', () => {
      const suggestions = slashCommandRegistry.getSuggestions('/cle');
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].command).toBe('clear');
    });

    it('should return empty array for no matches', () => {
      const suggestions = slashCommandRegistry.getSuggestions('/xyz');
      expect(suggestions).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const suggestions1 = slashCommandRegistry.getSuggestions('/HE');
      const suggestions2 = slashCommandRegistry.getSuggestions('/he');
      const suggestions3 = slashCommandRegistry.getSuggestions('/He');

      expect(suggestions1.length).toBe(2);
      expect(suggestions2.length).toBe(2);
      expect(suggestions3.length).toBe(2);
    });

    it('should match from start of command only', () => {
      const suggestions = slashCommandRegistry.getSuggestions('/ist');
      expect(suggestions).toEqual([]);
    });

    it('should handle commands with spaces in query', () => {
      const suggestions = slashCommandRegistry.getSuggestions('/help ');
      // When there's a space, it's looking for commands starting with "help "
      // which won't match "help", so it returns empty
      expect(suggestions.length).toBe(0);
    });
  });

  describe('execute', () => {
    it('should return handled: false for non-slash input', async () => {
      const result = await slashCommandRegistry.execute('regular message');
      expect(result.handled).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should return handled: false for unregistered command', async () => {
      const result = await slashCommandRegistry.execute('/unknown');
      expect(result.handled).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should execute registered command and return message', async () => {
      slashCommandRegistry.register({
        command: 'test',
        description: 'Test command',
        handler: () => 'test result',
      });

      const result = await slashCommandRegistry.execute('/test');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('test result');
    });

    it('should pass arguments to handler', async () => {
      slashCommandRegistry.register({
        command: 'echo',
        description: 'Echo arguments',
        handler: (args) => `Echo: ${args}`,
      });

      const result = await slashCommandRegistry.execute('/echo hello world');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('Echo: hello world');
    });

    it('should handle empty arguments', async () => {
      slashCommandRegistry.register({
        command: 'test',
        description: 'Test command',
        handler: (args) => `Args: "${args}"`,
      });

      const result = await slashCommandRegistry.execute('/test');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('Args: ""');
    });

    it('should handle async handlers', async () => {
      slashCommandRegistry.register({
        command: 'async',
        description: 'Async command',
        handler: async (args) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return `Async result: ${args}`;
        },
      });

      const result = await slashCommandRegistry.execute('/async test');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('Async result: test');
    });

    it('should handle handler errors gracefully', async () => {
      slashCommandRegistry.register({
        command: 'error',
        description: 'Error command',
        handler: () => {
          throw new Error('Test error');
        },
      });

      const result = await slashCommandRegistry.execute('/error');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('Error executing /error: Test error');
    });

    it('should handle non-Error exceptions', async () => {
      slashCommandRegistry.register({
        command: 'throw',
        description: 'Throw command',
        handler: () => {
          // eslint-disable-next-line no-throw-literal
          throw 'String error';
        },
      });

      const result = await slashCommandRegistry.execute('/throw');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('Error executing /throw: Unknown error');
    });

    it('should handle async handler errors', async () => {
      slashCommandRegistry.register({
        command: 'asyncerror',
        description: 'Async error command',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async error');
        },
      });

      const result = await slashCommandRegistry.execute('/asyncerror');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('Error executing /asyncerror: Async error');
    });

    it('should preserve multiple spaces in arguments', async () => {
      slashCommandRegistry.register({
        command: 'spaces',
        description: 'Test spaces',
        handler: (args) => args,
      });

      const result = await slashCommandRegistry.execute('/spaces hello    world');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('hello    world');
    });

    it('should handle command with special characters in args', async () => {
      slashCommandRegistry.register({
        command: 'special',
        description: 'Special chars',
        handler: (args) => args,
      });

      const result = await slashCommandRegistry.execute('/special @#$%^&*()');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('@#$%^&*()');
    });

    it('should be case-sensitive for command names', async () => {
      slashCommandRegistry.register({
        command: 'test',
        description: 'Test command',
        handler: () => 'success',
      });

      const result1 = await slashCommandRegistry.execute('/test');
      const result2 = await slashCommandRegistry.execute('/Test');
      const result3 = await slashCommandRegistry.execute('/TEST');

      expect(result1.handled).toBe(true);
      expect(result2.handled).toBe(false);
      expect(result3.handled).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: register, execute, unregister', async () => {
      const command: SlashCommand = {
        command: 'workflow',
        description: 'Workflow test',
        handler: (args) => `Processed: ${args}`,
      };

      // Register
      slashCommandRegistry.register(command);
      expect(slashCommandRegistry.get('workflow')).toBeDefined();

      // Execute
      const result = await slashCommandRegistry.execute('/workflow test data');
      expect(result.handled).toBe(true);
      expect(result.message).toBe('Processed: test data');

      // Unregister
      slashCommandRegistry.unregister('workflow');
      expect(slashCommandRegistry.get('workflow')).toBeUndefined();

      // Try to execute after unregister
      const result2 = await slashCommandRegistry.execute('/workflow test');
      expect(result2.handled).toBe(false);
    });

    it('should handle multiple commands with suggestions', async () => {
      slashCommandRegistry.register({
        command: 'save',
        description: 'Save data',
        handler: () => 'saved',
      });

      slashCommandRegistry.register({
        command: 'search',
        description: 'Search data',
        handler: () => 'searching',
      });

      slashCommandRegistry.register({
        command: 'send',
        description: 'Send message',
        handler: () => 'sent',
      });

      // Get suggestions
      const suggestions = slashCommandRegistry.getSuggestions('/s');
      expect(suggestions.length).toBe(3);

      // Execute each
      const result1 = await slashCommandRegistry.execute('/save');
      const result2 = await slashCommandRegistry.execute('/search');
      const result3 = await slashCommandRegistry.execute('/send');

      expect(result1.message).toBe('saved');
      expect(result2.message).toBe('searching');
      expect(result3.message).toBe('sent');
    });

    it('should prevent command replacement and log warning', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      slashCommandRegistry.register({
        command: 'test',
        description: 'Version 1',
        handler: () => 'v1',
      });

      let result = await slashCommandRegistry.execute('/test');
      expect(result.message).toBe('v1');

      // Try to replace with new version (should be ignored)
      slashCommandRegistry.register({
        command: 'test',
        description: 'Version 2',
        handler: () => 'v2',
      });

      // Should still execute the first version
      result = await slashCommandRegistry.execute('/test');
      expect(result.message).toBe('v1');

      // Should have logged a warning
      expect(consoleWarnSpy).toHaveBeenCalledWith('Slash command "/test" is already registered.');

      consoleWarnSpy.mockRestore();
    });
  });
});
