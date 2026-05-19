/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, getActiveProfile } from '../config';

// Save original env var values to restore later
const savedOsdUrl = process.env.OSD_URL;
const savedOsdToken = process.env.OSD_TOKEN;
const savedOsdUsername = process.env.OSD_USERNAME;
const savedOsdPassword = process.env.OSD_PASSWORD;

describe('Config', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osdctl-config-test-'));
    // Reset env vars
    delete process.env.OSD_URL;
    delete process.env.OSD_TOKEN;
    delete process.env.OSD_USERNAME;
    delete process.env.OSD_PASSWORD;
  });

  afterEach(() => {
    // Restore env vars to their original values
    if (savedOsdUrl !== undefined) { process.env.OSD_URL = savedOsdUrl; } else { delete process.env.OSD_URL; }
    if (savedOsdToken !== undefined) { process.env.OSD_TOKEN = savedOsdToken; } else { delete process.env.OSD_TOKEN; }
    if (savedOsdUsername !== undefined) { process.env.OSD_USERNAME = savedOsdUsername; } else { delete process.env.OSD_USERNAME; }
    if (savedOsdPassword !== undefined) { process.env.OSD_PASSWORD = savedOsdPassword; } else { delete process.env.OSD_PASSWORD; }
    // Clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should return default config when no config files exist', () => {
      const config = loadConfig();
      expect(config.defaultProfile).toBe('dev');
      expect(config.outputDir).toBe('./built');
      expect(config.profiles.dev).toBeDefined();
      expect(config.profiles.dev.url).toBe('http://localhost:5601');
    });

    it('should apply environment variable overrides for URL', () => {
      process.env.OSD_URL = 'http://custom:9200';
      const config = loadConfig();
      expect(config.profiles.dev.url).toBe('http://custom:9200');
    });

    it('should apply environment variable overrides for token', () => {
      process.env.OSD_TOKEN = 'my-secret-token';
      const config = loadConfig();
      expect(config.profiles.dev.token).toBe('my-secret-token');
    });

    it('should apply environment variable overrides for username and password', () => {
      process.env.OSD_USERNAME = 'admin';
      process.env.OSD_PASSWORD = 'secret';
      const config = loadConfig();
      expect(config.profiles.dev.username).toBe('admin');
      expect(config.profiles.dev.password).toBe('secret');
    });

    it('should select a named profile when specified', () => {
      const config = loadConfig('staging');
      expect(config.defaultProfile).toBe('staging');
    });

    it('should return default values for outputDir', () => {
      const config = loadConfig();
      expect(config.outputDir).toBe('./built');
    });

    it('should return undefined for lint when not configured', () => {
      const config = loadConfig();
      // Default config does not include lint rules
      expect(config.lint).toBeUndefined();
    });
  });

  describe('getActiveProfile', () => {
    it('should return the active profile', () => {
      const config = {
        profiles: { dev: { url: 'http://localhost:5601' } },
        defaultProfile: 'dev',
        outputDir: './built',
      };
      const profile = getActiveProfile(config);
      expect(profile.url).toBe('http://localhost:5601');
    });

    it('should throw an error for a non-existent profile', () => {
      const config = {
        profiles: { dev: { url: 'http://localhost:5601' } },
        defaultProfile: 'nonexistent',
        outputDir: './built',
      };
      expect(() => getActiveProfile(config)).toThrow('Profile "nonexistent" not found');
    });

    it('should include available profiles in error message', () => {
      const config = {
        profiles: { dev: { url: 'http://localhost:5601' } },
        defaultProfile: 'nonexistent',
        outputDir: './built',
      };
      expect(() => getActiveProfile(config)).toThrow('Available profiles:');
    });
  });
});
