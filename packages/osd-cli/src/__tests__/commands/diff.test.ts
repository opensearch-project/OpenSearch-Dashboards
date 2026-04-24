/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { diffCommand } from '../../commands/diff';
import { OsdctlConfig } from '../../config';

describe('diff command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let mockServer: http.Server;
  let port: number;
  let serverResponse: unknown;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-diff-test-'));
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    process.exitCode = undefined;

    serverResponse = [];

    mockServer = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(serverResponse));
      });
    });

    await new Promise<void>((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    port = (mockServer.address() as { port: number }).port;
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    process.exitCode = undefined;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  function writeJson(name: string, obj: unknown): void {
    fs.writeFileSync(path.join(tmpDir, name), JSON.stringify(obj, null, 2));
  }

  function makeConfig(): OsdctlConfig {
    return {
      profiles: { dev: { url: `http://127.0.0.1:${port}` } },
      defaultProfile: 'dev',
      outputDir: tmpDir,
    };
  }

  it('should show NEW status for new objects', async () => {
    writeJson('new-dash.json', {
      type: 'dashboard',
      id: 'new-1',
      attributes: { title: 'New Dashboard' },
    });

    serverResponse = [{ status: 'NEW', type: 'dashboard', id: 'new-1' }];

    await diffCommand({ inputDir: tmpDir, config: makeConfig() });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('NEW'));
  });

  it('should show UPDATED status for changed objects', async () => {
    writeJson('updated-dash.json', {
      type: 'dashboard',
      id: 'updated-1',
      attributes: { title: 'Updated Dashboard' },
    });

    serverResponse = [
      {
        status: 'UPDATED',
        type: 'dashboard',
        id: 'updated-1',
        diff: '- title: Old Title\n+ title: Updated Dashboard',
      },
    ];

    await diffCommand({ inputDir: tmpDir, config: makeConfig() });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('UPDATED'));
  });

  it('should show UNCHANGED status for identical objects', async () => {
    writeJson('same-dash.json', {
      type: 'dashboard',
      id: 'same-1',
      attributes: { title: 'Same Dashboard' },
    });

    serverResponse = [{ status: 'UNCHANGED', type: 'dashboard', id: 'same-1' }];

    await diffCommand({ inputDir: tmpDir, config: makeConfig() });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('UNCHANGED'));
  });

  it('should write .diff files when output-dir is specified', async () => {
    const diffOutputDir = path.join(tmpDir, 'diffs');

    writeJson('changed.json', {
      type: 'dashboard',
      id: 'changed-1',
      attributes: { title: 'Changed' },
    });

    serverResponse = [
      {
        status: 'UPDATED',
        type: 'dashboard',
        id: 'changed-1',
        diff: '- old\n+ new',
      },
    ];

    await diffCommand({
      inputDir: tmpDir,
      outputDir: diffOutputDir,
      config: makeConfig(),
    });

    const diffFile = path.join(diffOutputDir, 'changed.diff');
    expect(fs.existsSync(diffFile)).toBe(true);
    expect(fs.readFileSync(diffFile, 'utf-8')).toContain('- old');
  });

  it('should print summary counts', async () => {
    writeJson('a.json', { type: 'dashboard', id: 'a', attributes: {} });
    writeJson('b.json', { type: 'dashboard', id: 'b', attributes: {} });

    serverResponse = [
      { status: 'NEW', type: 'dashboard', id: 'a' },
      { status: 'UNCHANGED', type: 'dashboard', id: 'b' },
    ];

    await diffCommand({ inputDir: tmpDir, config: makeConfig() });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('1 new')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('1 unchanged')
    );
  });

  it('should report error when no files found', async () => {
    await diffCommand({
      inputDir: path.join(tmpDir, 'empty'),
      config: makeConfig(),
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No files found'));
    expect(process.exitCode).toBe(1);
  });
});
