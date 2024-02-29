/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import path from 'path';
import { readFileSync } from 'fs';
import { matches } from './matches';

/**
 * configuration based on files.
 */
export type FileBasedConfig = Record<string, { approved?: string[]; explanation?: string }>;

/**
 * configuration based on files.
 */
export type ValueBasedConfig = Record<
  string,
  Record<string, Array<{ approved?: string; rejected?: string[] }>>
>;

/**
 * Retrieves rules from a configuration file.
 * @param configPath - The path to the configuration file.
 * @returns Parsed rules from the configuration file.
 */
export const getRulesFromConfig = (configPath: string) => {
  const filePath = path.resolve(__dirname, configPath);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

/**
 * Retrieves a rule from a file-based configuration.
 * @param rules - The file-based configuration rules.
 * @param value - The value to match against the configuration rules.
 * @returns The rule corresponding to the matched value, or undefined if no match is found.
 */
export const getRuleFromConfig = (rules: FileBasedConfig, value: string) => {
  for (const key of Object.keys(rules)) {
    if (matches(key, value)) {
      return rules[key];
    }
  }

  return undefined;
};
