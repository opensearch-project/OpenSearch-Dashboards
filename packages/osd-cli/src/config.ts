/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fromYaml } from './utils/yaml';
import { resolveVariables } from './utils/variables';

/**
 * Lint rule configuration.
 */
export interface LintRuleConfig {
  'require-labels'?: boolean | string[];
  'require-annotations'?: boolean | string[];
  'require-description'?: boolean;
  'max-panels'?: number;
  'naming-convention'?: string; // regex pattern
}

/**
 * Profile configuration for connecting to an OSD instance.
 */
export interface ProfileConfig {
  url: string;
  token?: string;
  token_command?: string; // shell command that outputs a token
  username?: string;
  password?: string;
  variables?: Record<string, string>;
}

/**
 * Top-level configuration interface.
 */
export interface OsdctlConfig {
  profiles: Record<string, ProfileConfig>;
  defaultProfile: string;
  outputDir: string;
  lint?: LintRuleConfig;
  variables?: Record<string, string>;
}

const DEFAULT_CONFIG: OsdctlConfig = {
  profiles: {
    dev: {
      url: 'http://localhost:5601',
    },
  },
  defaultProfile: 'dev',
  outputDir: './built',
};

/**
 * Load config from a file path if it exists.
 * Supports both JSON and simple YAML formats.
 */
function loadConfigFile(filePath: string): Partial<OsdctlConfig> | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath);

    if (ext === '.json') {
      return JSON.parse(content);
    }

    // For .yaml/.yml files, try JSON first then simple YAML parser
    const parsed = fromYaml(content);
    return parsed as Partial<OsdctlConfig>;
  } catch {
    return null;
  }
}

/**
 * Apply environment variable overrides to a profile.
 */
function applyEnvOverrides(config: OsdctlConfig): OsdctlConfig {
  const profile = config.profiles[config.defaultProfile] || {};

  if (process.env.OSD_URL) {
    profile.url = process.env.OSD_URL;
  }
  if (process.env.OSD_TOKEN) {
    profile.token = process.env.OSD_TOKEN;
  }
  if (process.env.OSD_USERNAME) {
    profile.username = process.env.OSD_USERNAME;
  }
  if (process.env.OSD_PASSWORD) {
    profile.password = process.env.OSD_PASSWORD;
  }

  config.profiles[config.defaultProfile] = profile;
  return config;
}

/**
 * Merge two config objects, with overrides taking precedence.
 */
function mergeConfig(base: OsdctlConfig, overrides: Partial<OsdctlConfig>): OsdctlConfig {
  return {
    profiles: { ...base.profiles, ...(overrides.profiles || {}) },
    defaultProfile: overrides.defaultProfile || base.defaultProfile,
    outputDir: overrides.outputDir || base.outputDir,
    lint: overrides.lint ? { ...base.lint, ...overrides.lint } : base.lint,
    variables: overrides.variables
      ? { ...(base.variables || {}), ...overrides.variables }
      : base.variables,
  };
}

/**
 * Load the full configuration, merging defaults, global config, project config,
 * and environment variable overrides.
 */
export function loadConfig(profileName?: string): OsdctlConfig {
  let config: OsdctlConfig = { ...DEFAULT_CONFIG, profiles: { ...DEFAULT_CONFIG.profiles } };

  // Load global config from ~/.osdctl/config.yaml
  const globalConfigPath = path.join(os.homedir(), '.osdctl', 'config.yaml');
  const globalConfig = loadConfigFile(globalConfigPath);
  if (globalConfig) {
    config = mergeConfig(config, globalConfig);
  }

  // Load project config from .osdctl.yaml in current directory
  const projectConfigPath = path.join(process.cwd(), '.osdctl.yaml');
  const projectConfig = loadConfigFile(projectConfigPath);
  if (projectConfig) {
    config = mergeConfig(config, projectConfig);
  }

  // Override profile if specified
  if (profileName) {
    config.defaultProfile = profileName;
  }

  // Apply environment variable overrides
  config = applyEnvOverrides(config);

  return config;
}

/**
 * Get the active profile configuration.
 */
export function getActiveProfile(config: OsdctlConfig): ProfileConfig {
  const profile = config.profiles[config.defaultProfile];
  if (!profile) {
    throw new Error(
      `Profile "${config.defaultProfile}" not found. Available profiles: ${Object.keys(config.profiles).join(', ')}`
    );
  }
  return profile;
}

/**
 * Get the resolved variables for the active profile.
 * Profile-level variables override top-level variables.
 */
export function getResolvedVariables(config: OsdctlConfig): Record<string, string> {
  const profile = getActiveProfile(config);
  return resolveVariables(config.variables, profile.variables);
}
