/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { buildCommand } from '../../commands/build';

// Mock execSync to avoid needing npx tsx installed
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

import { execSync } from 'child_process';

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('build command', () => {
  let tmpDir: string;
  let outputDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-build-test-'));
    outputDir = path.join(tmpDir, 'built');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    process.exitCode = undefined;
    mockedExecSync.mockReset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    stdoutSpy.mockRestore();
    process.exitCode = undefined;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should build a single TypeScript file', async () => {
    const srcFile = path.join(tmpDir, 'test.ts');
    fs.writeFileSync(srcFile, 'console.log(JSON.stringify({type:"dashboard",id:"test"}));');

    mockedExecSync.mockReturnValue(JSON.stringify({ type: 'dashboard', id: 'test' }));

    await buildCommand({
      file: srcFile,
      outputFormat: 'json',
      outputDir,
      stdout: false,
    });

    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('npx tsx'),
      expect.any(Object)
    );

    const outputFile = path.join(outputDir, 'test.json');
    expect(fs.existsSync(outputFile)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    expect(content.type).toBe('dashboard');
  });

  it('should build all files in a directory', async () => {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'a.ts'), '');
    fs.writeFileSync(path.join(srcDir, 'b.ts'), '');

    mockedExecSync.mockReturnValue(JSON.stringify({ type: 'dashboard', id: 'a' }));

    await buildCommand({
      directory: srcDir,
      outputFormat: 'json',
      outputDir,
      stdout: false,
    });

    expect(mockedExecSync).toHaveBeenCalledTimes(2);
  });

  it('should output YAML format', async () => {
    const srcFile = path.join(tmpDir, 'test.ts');
    fs.writeFileSync(srcFile, '');

    mockedExecSync.mockReturnValue(JSON.stringify({ type: 'dashboard', id: 'test', title: 'My Dashboard' }));

    await buildCommand({
      file: srcFile,
      outputFormat: 'yaml',
      outputDir,
      stdout: false,
    });

    const outputFile = path.join(outputDir, 'test.yaml');
    expect(fs.existsSync(outputFile)).toBe(true);
    const content = fs.readFileSync(outputFile, 'utf-8');
    expect(content).toContain('type: dashboard');
    expect(content).toContain('id: test');
  });

  it('should output JSON format', async () => {
    const srcFile = path.join(tmpDir, 'test.ts');
    fs.writeFileSync(srcFile, '');

    mockedExecSync.mockReturnValue(JSON.stringify({ type: 'dashboard', id: 'test' }));

    await buildCommand({
      file: srcFile,
      outputFormat: 'json',
      outputDir,
      stdout: false,
    });

    const outputFile = path.join(outputDir, 'test.json');
    expect(fs.existsSync(outputFile)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    expect(content.type).toBe('dashboard');
  });

  it('should print to stdout when --stdout is set', async () => {
    const srcFile = path.join(tmpDir, 'test.ts');
    fs.writeFileSync(srcFile, '');

    const data = { type: 'dashboard', id: 'test' };
    mockedExecSync.mockReturnValue(JSON.stringify(data));

    await buildCommand({
      file: srcFile,
      outputFormat: 'json',
      outputDir,
      stdout: true,
    });

    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0][0];
    expect(JSON.parse(output)).toEqual(data);
  });

  it('should report error when no file or directory is specified', async () => {
    await buildCommand({
      outputFormat: 'json',
      outputDir,
      stdout: false,
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('must be specified'));
    expect(process.exitCode).toBe(1);
  });

  it('should report error when directory does not exist', async () => {
    await buildCommand({
      directory: path.join(tmpDir, 'nonexistent'),
      outputFormat: 'json',
      outputDir,
      stdout: false,
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(process.exitCode).toBe(1);
  });

  it('should handle build errors gracefully', async () => {
    const srcFile = path.join(tmpDir, 'test.ts');
    fs.writeFileSync(srcFile, '');

    mockedExecSync.mockImplementation(() => {
      const err = new Error('Compilation failed');
      (err as any).stderr = 'SyntaxError: unexpected token';
      throw err;
    });

    await buildCommand({
      file: srcFile,
      outputFormat: 'json',
      outputDir,
      stdout: false,
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to build'));
  });

  it('should skip .d.ts files in directory mode', async () => {
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'a.ts'), '');
    fs.writeFileSync(path.join(srcDir, 'a.d.ts'), '');

    mockedExecSync.mockReturnValue(JSON.stringify({ type: 'dashboard', id: 'a' }));

    await buildCommand({
      directory: srcDir,
      outputFormat: 'json',
      outputDir,
      stdout: false,
    });

    // Should only build a.ts, not a.d.ts
    expect(mockedExecSync).toHaveBeenCalledTimes(1);
  });
});
