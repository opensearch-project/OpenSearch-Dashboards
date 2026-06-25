/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { lintCommand, lintObject } from '../../commands/lint';
import { OsdctlConfig, LintRuleConfig } from '../../config';
import { SavedObject } from '../../client';

describe('lint command', () => {
  let tmpDir: string;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-lint-test-'));
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    process.exitCode = undefined;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    process.exitCode = undefined;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeJson(name: string, obj: unknown): void {
    fs.writeFileSync(path.join(tmpDir, name), JSON.stringify(obj, null, 2));
  }

  function makeConfig(lint: LintRuleConfig): OsdctlConfig {
    return {
      profiles: { dev: { url: 'http://localhost:5601' } },
      defaultProfile: 'dev',
      outputDir: tmpDir,
      lint,
    };
  }

  describe('lintObject', () => {
    it('should detect missing required labels', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
      };

      const messages = lintObject(obj, { 'require-labels': true });
      expect(messages).toHaveLength(1);
      expect(messages[0].rule).toBe('require-labels');
      expect(messages[0].level).toBe('ERROR');
    });

    it('should detect specific missing required labels', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
        labels: { team: 'my-team' },
      };

      const messages = lintObject(obj, { 'require-labels': ['team', 'env'] });
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toContain('env');
    });

    it('should pass when all required labels are present', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
        labels: { team: 'my-team', env: 'prod' },
      };

      const messages = lintObject(obj, { 'require-labels': ['team', 'env'] });
      expect(messages).toHaveLength(0);
    });

    it('should detect missing description', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
      };

      const messages = lintObject(obj, { 'require-description': true });
      expect(messages).toHaveLength(1);
      expect(messages[0].rule).toBe('require-description');
      expect(messages[0].level).toBe('WARN');
    });

    it('should pass when description is present', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test', description: 'A test dashboard' },
      };

      const messages = lintObject(obj, { 'require-description': true });
      expect(messages).toHaveLength(0);
    });

    it('should detect max panels exceeded', () => {
      const panels = Array.from({ length: 5 }, (_, i) => ({
        panelIndex: String(i),
        type: 'visualization',
        id: `viz-${i}`,
      }));

      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test', panels },
      };

      const messages = lintObject(obj, { 'max-panels': 3 });
      expect(messages).toHaveLength(1);
      expect(messages[0].rule).toBe('max-panels');
      expect(messages[0].message).toContain('5 panels');
      expect(messages[0].message).toContain('maximum of 3');
    });

    it('should pass when panels are within limit', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: {
          title: 'Test',
          panels: [{ panelIndex: '1', type: 'viz', id: 'v1' }],
        },
      };

      const messages = lintObject(obj, { 'max-panels': 10 });
      expect(messages).toHaveLength(0);
    });

    it('should detect naming convention violations', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'My Dashboard!!!',
        attributes: { title: 'Test' },
      };

      const messages = lintObject(obj, { 'naming-convention': '^[a-z0-9-]+$' });
      expect(messages).toHaveLength(1);
      expect(messages[0].rule).toBe('naming-convention');
    });

    it('should pass naming convention when id matches', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'my-dashboard-123',
        attributes: { title: 'Test' },
      };

      const messages = lintObject(obj, { 'naming-convention': '^[a-z0-9-]+$' });
      expect(messages).toHaveLength(0);
    });

    it('should detect missing annotations', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
      };

      const messages = lintObject(obj, { 'require-annotations': true });
      expect(messages).toHaveLength(1);
      expect(messages[0].rule).toBe('require-annotations');
    });

    it('should pass all rules on a valid dashboard', () => {
      const obj: SavedObject = {
        type: 'dashboard',
        id: 'my-dashboard',
        attributes: {
          title: 'My Dashboard',
          description: 'A well-documented dashboard',
          panels: [{ panelIndex: '1', type: 'viz', id: 'v1' }],
        },
        labels: { team: 'my-team', env: 'prod' },
        annotations: { source: 'osdctl' },
      };

      const rules: LintRuleConfig = {
        'require-labels': ['team'],
        'require-description': true,
        'require-annotations': true,
        'max-panels': 50,
        'naming-convention': '^[a-z0-9-]+$',
      };

      const messages = lintObject(obj, rules);
      expect(messages).toHaveLength(0);
    });
  });

  describe('lintCommand', () => {
    it('should lint files and report errors', async () => {
      writeJson('bad.json', {
        type: 'dashboard',
        id: 'bad',
        attributes: { title: 'Bad Dashboard' },
      });

      await lintCommand({
        inputDir: tmpDir,
        config: makeConfig({ 'require-labels': true, 'require-description': true }),
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
      expect(process.exitCode).toBe(1);
    });

    it('should lint files and pass on valid objects', async () => {
      writeJson('good.json', {
        type: 'dashboard',
        id: 'good',
        attributes: { title: 'Good', description: 'A good dashboard' },
        labels: { team: 'my-team' },
      });

      await lintCommand({
        inputDir: tmpDir,
        config: makeConfig({ 'require-labels': true, 'require-description': true }),
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PASS'));
      expect(process.exitCode).toBeUndefined();
    });

    it('should handle no lint rules configured', async () => {
      writeJson('test.json', {
        type: 'dashboard',
        id: 'test',
        attributes: {},
      });

      await lintCommand({
        inputDir: tmpDir,
        config: {
          profiles: { dev: { url: 'http://localhost:5601' } },
          defaultProfile: 'dev',
          outputDir: tmpDir,
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No lint rules'));
    });

    it('should report error when no files found', async () => {
      await lintCommand({
        inputDir: path.join(tmpDir, 'empty'),
        config: makeConfig({ 'require-labels': true }),
      });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No files found'));
      expect(process.exitCode).toBe(1);
    });

    it('should count errors and warnings separately', async () => {
      writeJson('test.json', {
        type: 'dashboard',
        id: 'test',
        attributes: { title: 'Test' },
      });

      await lintCommand({
        inputDir: tmpDir,
        config: makeConfig({
          'require-labels': true,
          'require-description': true,
        }),
      });

      // require-labels is ERROR, require-description is WARN
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 error(s), 1 warning(s)')
      );
    });
  });
});
