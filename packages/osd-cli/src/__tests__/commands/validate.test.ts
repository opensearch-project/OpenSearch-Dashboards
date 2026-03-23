/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { validateCommand, readBuiltFiles } from '../../commands/validate';
import { OsdctlConfig } from '../../config';

describe('validate command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-validate-test-'));
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    process.exitCode = undefined;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    process.exitCode = undefined;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeJson(name: string, obj: unknown): void {
    fs.writeFileSync(path.join(tmpDir, name), JSON.stringify(obj, null, 2));
  }

  function makeConfig(port?: number): OsdctlConfig {
    return {
      profiles: {
        dev: { url: port ? `http://127.0.0.1:${port}` : 'http://localhost:5601' },
      },
      defaultProfile: 'dev',
      outputDir: tmpDir,
    };
  }

  describe('readBuiltFiles', () => {
    it('should read JSON files from a directory', () => {
      writeJson('test.json', { type: 'dashboard', id: 'test', attributes: {} });
      const files = readBuiltFiles(tmpDir);
      expect(files).toHaveLength(1);
      expect(files[0].object.type).toBe('dashboard');
    });

    it('should return empty array for non-existent directory', () => {
      const files = readBuiltFiles(path.join(tmpDir, 'nonexistent'));
      expect(files).toHaveLength(0);
    });

    it('should skip non-JSON/YAML files', () => {
      fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'hello');
      writeJson('valid.json', { type: 'dashboard', id: 'test', attributes: {} });
      const files = readBuiltFiles(tmpDir);
      expect(files).toHaveLength(1);
    });
  });

  describe('local validation', () => {
    it('should pass valid files', async () => {
      writeJson('valid.json', {
        type: 'dashboard',
        id: 'valid-dash',
        attributes: { title: 'Valid Dashboard' },
        references: [],
      });

      await validateCommand({
        inputDir: tmpDir,
        server: false,
        config: makeConfig(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('VALID'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('valid'));
    });

    it('should report errors for missing type', async () => {
      writeJson('invalid.json', {
        id: 'no-type',
        attributes: { title: 'Missing Type' },
      });

      await validateCommand({
        inputDir: tmpDir,
        server: false,
        config: makeConfig(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
      expect(process.exitCode).toBe(1);
    });

    it('should report errors for missing id', async () => {
      writeJson('no-id.json', {
        type: 'dashboard',
        attributes: { title: 'Missing ID' },
      });

      await validateCommand({
        inputDir: tmpDir,
        server: false,
        config: makeConfig(),
      });

      expect(process.exitCode).toBe(1);
    });

    it('should report errors for missing attributes', async () => {
      writeJson('no-attrs.json', {
        type: 'dashboard',
        id: 'no-attrs',
      });

      await validateCommand({
        inputDir: tmpDir,
        server: false,
        config: makeConfig(),
      });

      expect(process.exitCode).toBe(1);
    });

    it('should report error when no files are found', async () => {
      await validateCommand({
        inputDir: path.join(tmpDir, 'empty'),
        server: false,
        config: makeConfig(),
      });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No files found'));
      expect(process.exitCode).toBe(1);
    });
  });

  describe('server validation', () => {
    it('should call API when --server is set', async () => {
      writeJson('test.json', {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
      });

      // Create mock server
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([{ valid: true }]));
      });

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = (server.address() as { port: number }).port;

      try {
        await validateCommand({
          inputDir: tmpDir,
          server: true,
          config: makeConfig(port),
        });

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('VALID'));
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it('should report server validation errors', async () => {
      writeJson('test.json', {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
      });

      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify([
            {
              valid: false,
              errors: [{ path: 'attributes.title', message: 'Title is too short' }],
            },
          ])
        );
      });

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = (server.address() as { port: number }).port;

      try {
        await validateCommand({
          inputDir: tmpDir,
          server: true,
          config: makeConfig(port),
        });

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
        expect(process.exitCode).toBe(1);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });
});
