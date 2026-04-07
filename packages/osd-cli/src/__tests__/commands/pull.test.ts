/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { pullCommand, parseLabels } from '../../commands/pull';
import { OsdctlConfig } from '../../config';

describe('pull command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let mockServer: http.Server;
  let port: number;
  let serverResponse: unknown;
  let lastRequestBody: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-pull-test-'));
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

  function makeConfig(): OsdctlConfig {
    return {
      profiles: { dev: { url: `http://127.0.0.1:${port}` } },
      defaultProfile: 'dev',
      outputDir: './built',
    };
  }

  describe('parseLabels', () => {
    it('should parse a single label', () => {
      expect(parseLabels('team=my-team')).toEqual({ team: 'my-team' });
    });

    it('should parse multiple labels', () => {
      expect(parseLabels('team=my-team,env=prod')).toEqual({
        team: 'my-team',
        env: 'prod',
      });
    });

    it('should handle whitespace', () => {
      expect(parseLabels('team = my-team , env = prod')).toEqual({
        team: 'my-team',
        env: 'prod',
      });
    });
  });

  it('should pull objects and write YAML files', async () => {
    const outputDir = path.join(tmpDir, 'pulled');

    serverResponse = [
      {
        type: 'dashboard',
        id: 'dash-1',
        attributes: { title: 'Dashboard 1' },
      },
      {
        type: 'dashboard',
        id: 'dash-2',
        attributes: { title: 'Dashboard 2' },
      },
    ];

    await pullCommand({
      outputDir,
      outputFormat: 'yaml',
      config: makeConfig(),
    });

    expect(fs.existsSync(path.join(outputDir, 'dashboard-dash-1.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'dashboard-dash-2.yaml'))).toBe(true);

    const content = fs.readFileSync(path.join(outputDir, 'dashboard-dash-1.yaml'), 'utf-8');
    expect(content).toContain('type: dashboard');
  });

  it('should pull objects and write JSON files', async () => {
    const outputDir = path.join(tmpDir, 'pulled');

    serverResponse = [
      {
        type: 'dashboard',
        id: 'dash-1',
        attributes: { title: 'Dashboard 1' },
      },
    ];

    await pullCommand({
      outputDir,
      outputFormat: 'json',
      config: makeConfig(),
    });

    const filePath = path.join(outputDir, 'dashboard-dash-1.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.type).toBe('dashboard');
    expect(content.id).toBe('dash-1');
  });

  it('should pass labels to the API when filtering', async () => {
    const outputDir = path.join(tmpDir, 'pulled');
    serverResponse = [];

    await pullCommand({
      outputDir,
      outputFormat: 'yaml',
      labels: { team: 'my-team', env: 'prod' },
      config: makeConfig(),
    });

    const body = JSON.parse(lastRequestBody);
    expect(body.labels).toEqual({ team: 'my-team', env: 'prod' });
  });

  it('should handle empty results', async () => {
    const outputDir = path.join(tmpDir, 'pulled');
    serverResponse = [];

    await pullCommand({
      outputDir,
      outputFormat: 'yaml',
      config: makeConfig(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No objects found'));
  });

  it('should handle server errors gracefully', async () => {
    // Close the mock and create one that returns 500
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));

    mockServer = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal error' }));
    });

    await new Promise<void>((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    port = (mockServer.address() as { port: number }).port;

    const outputDir = path.join(tmpDir, 'pulled');

    await pullCommand({
      outputDir,
      outputFormat: 'yaml',
      config: makeConfig(),
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Pull failed'));
    expect(process.exitCode).toBe(1);
  });

  it('should create output directory if it does not exist', async () => {
    const outputDir = path.join(tmpDir, 'deep', 'nested', 'dir');

    serverResponse = [
      {
        type: 'dashboard',
        id: 'dash-1',
        attributes: { title: 'Test' },
      },
    ];

    await pullCommand({
      outputDir,
      outputFormat: 'json',
      config: makeConfig(),
    });

    expect(fs.existsSync(outputDir)).toBe(true);
  });
});
