/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { applyCommand } from '../../commands/apply';
import { OsdctlConfig } from '../../config';

describe('apply command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let mockServer: http.Server;
  let port: number;
  let serverResponse: unknown;
  let lastRequestBody: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-apply-test-'));
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    process.exitCode = undefined;
    lastRequestBody = '';

    serverResponse = [];

    mockServer = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        lastRequestBody = Buffer.concat(chunks).toString('utf-8');
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

  it('should call bulk_apply with dry-run mode', async () => {
    writeJson('test.json', {
      type: 'dashboard',
      id: 'test-1',
      attributes: { title: 'Test' },
    });

    serverResponse = [{ status: 'CREATED', type: 'dashboard', id: 'test-1', version: 1 }];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: true,
      confirm: false,
      config: makeConfig(),
    });

    const body = JSON.parse(lastRequestBody);
    expect(body.dryRun).toBe(true);
  });

  it('should call bulk_apply and show results', async () => {
    writeJson('test.json', {
      type: 'dashboard',
      id: 'test-1',
      attributes: { title: 'Test' },
    });

    serverResponse = [{ status: 'CREATED', type: 'dashboard', id: 'test-1', version: 1 }];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CREATED'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1'));
  });

  it('should stamp managed-by: osdctl label on objects', async () => {
    writeJson('test.json', {
      type: 'dashboard',
      id: 'test-1',
      attributes: { title: 'Test' },
      labels: { team: 'my-team' },
    });

    serverResponse = [{ status: 'CREATED', type: 'dashboard', id: 'test-1', version: 1 }];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    const body = JSON.parse(lastRequestBody);
    expect(body.objects[0].labels['managed-by']).toBe('osdctl');
    // Should also preserve existing labels
    expect(body.objects[0].labels['team']).toBe('my-team');
  });

  it('should add managed-by label even when no labels exist', async () => {
    writeJson('test.json', {
      type: 'dashboard',
      id: 'test-1',
      attributes: { title: 'Test' },
    });

    serverResponse = [{ status: 'CREATED', type: 'dashboard', id: 'test-1', version: 1 }];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    const body = JSON.parse(lastRequestBody);
    expect(body.objects[0].labels['managed-by']).toBe('osdctl');
  });

  it('should show UPDATED status', async () => {
    writeJson('test.json', {
      type: 'dashboard',
      id: 'test-1',
      attributes: { title: 'Test' },
    });

    serverResponse = [{ status: 'UPDATED', type: 'dashboard', id: 'test-1', version: 2 }];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('UPDATED'));
  });

  it('should show UNCHANGED status', async () => {
    writeJson('test.json', {
      type: 'dashboard',
      id: 'test-1',
      attributes: { title: 'Test' },
    });

    serverResponse = [{ status: 'UNCHANGED', type: 'dashboard', id: 'test-1' }];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('UNCHANGED'));
  });

  it('should show ERROR status and set exit code', async () => {
    writeJson('test.json', {
      type: 'dashboard',
      id: 'test-1',
      attributes: { title: 'Test' },
    });

    serverResponse = [
      { status: 'ERROR', type: 'dashboard', id: 'test-1', error: 'Permission denied' },
    ];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    expect(process.exitCode).toBe(1);
  });

  it('should report error when no files found', async () => {
    await applyCommand({
      inputDir: path.join(tmpDir, 'empty'),
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No files found'));
    expect(process.exitCode).toBe(1);
  });

  it('should print summary counts', async () => {
    writeJson('a.json', { type: 'dashboard', id: 'a', attributes: { title: 'A' } });
    writeJson('b.json', { type: 'dashboard', id: 'b', attributes: { title: 'B' } });

    serverResponse = [
      { status: 'CREATED', type: 'dashboard', id: 'a', version: 1 },
      { status: 'UPDATED', type: 'dashboard', id: 'b', version: 3 },
    ];

    await applyCommand({
      inputDir: tmpDir,
      dryRun: false,
      confirm: false,
      config: makeConfig(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('1 created')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('1 updated')
    );
  });
});
