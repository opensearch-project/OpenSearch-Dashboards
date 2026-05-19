/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseArgs, main } from '../cli';

describe('CLI argument parser', () => {
  describe('parseArgs', () => {
    it('should parse a command with no flags', () => {
      const result = parseArgs(['init']);
      expect(result.command).toBe('init');
      expect(result.flags).toEqual({});
      expect(result.positional).toEqual([]);
    });

    it('should parse all known commands', () => {
      const commands = ['init', 'build', 'validate', 'diff', 'apply', 'pull', 'lint', 'preview'];
      for (const cmd of commands) {
        const result = parseArgs([cmd]);
        expect(result.command).toBe(cmd);
      }
    });

    it('should parse the --help flag', () => {
      const result = parseArgs(['--help']);
      expect(result.flags['help']).toBe(true);
      expect(result.command).toBe('');
    });

    it('should parse -h shorthand for help', () => {
      const result = parseArgs(['-h']);
      expect(result.flags['help']).toBe(true);
    });

    it('should parse --version flag', () => {
      const result = parseArgs(['--version']);
      expect(result.flags['version']).toBe(true);
    });

    it('should parse -v shorthand for version', () => {
      const result = parseArgs(['-v']);
      expect(result.flags['version']).toBe(true);
    });

    it('should parse command-level help', () => {
      const result = parseArgs(['build', '--help']);
      expect(result.command).toBe('build');
      expect(result.flags['help']).toBe(true);
    });

    it('should parse short flags with values', () => {
      const result = parseArgs(['build', '-f', 'myfile.ts']);
      expect(result.command).toBe('build');
      expect(result.flags['f']).toBe('myfile.ts');
    });

    it('should parse long flags with values', () => {
      const result = parseArgs(['build', '--output-dir', '/tmp/out']);
      expect(result.command).toBe('build');
      expect(result.flags['output-dir']).toBe('/tmp/out');
    });

    it('should parse boolean flags', () => {
      const result = parseArgs(['apply', '--dry-run', '--confirm']);
      expect(result.command).toBe('apply');
      expect(result.flags['dry-run']).toBe(true);
      expect(result.flags['confirm']).toBe(true);
    });

    it('should parse --stdout as boolean', () => {
      const result = parseArgs(['build', '-f', 'test.ts', '--stdout']);
      expect(result.flags['stdout']).toBe(true);
      expect(result.flags['f']).toBe('test.ts');
    });

    it('should parse --server as boolean', () => {
      const result = parseArgs(['validate', '--server']);
      expect(result.flags['server']).toBe(true);
    });

    it('should parse positional args after the command', () => {
      const result = parseArgs(['init', 'my-project']);
      expect(result.command).toBe('init');
      expect(result.positional).toEqual(['my-project']);
    });

    it('should parse long flags with = syntax', () => {
      const result = parseArgs(['build', '--output-dir=/tmp/out']);
      expect(result.flags['output-dir']).toBe('/tmp/out');
    });

    it('should parse mixed flags and positional args', () => {
      const result = parseArgs(['init', 'mydir', '--language', 'typescript']);
      expect(result.command).toBe('init');
      expect(result.positional).toEqual(['mydir']);
      expect(result.flags['language']).toBe('typescript');
    });
  });

  describe('main', () => {
    let consoleSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      errorSpy = jest.spyOn(console, 'error').mockImplementation();
      process.exitCode = undefined;
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      errorSpy.mockRestore();
      process.exitCode = undefined;
    });

    it('should print version when --version is passed', async () => {
      await main(['--version']);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('osdctl version'));
    });

    it('should print help when --help is passed', async () => {
      await main(['--help']);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('USAGE'));
    });

    it('should print help when no command is given', async () => {
      await main([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('USAGE'));
    });

    it('should report error for unknown command', async () => {
      await main(['foobar']);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
      expect(process.exitCode).toBe(1);
    });

    it('should print command help for known command with --help', async () => {
      await main(['build', '--help']);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Build TypeScript'));
    });

    it('should print coming soon for preview command', async () => {
      await main(['preview']);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('coming soon'));
    });
  });
});
