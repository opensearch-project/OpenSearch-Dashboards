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

export type FileBasedConfig = Record<string, { approved?: string[] }>;
export type ValueBasedConfig = Record<
  string,
  Record<string, Array<{ approved?: string; rejected?: string[] }>>
>;

export const getRulesFromConfig = (configPath: string) => {
  const filePath = path.resolve(__dirname, configPath);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

export const getSelectorRule = (rules: FileBasedConfig, rule: any) => {
  for (const configRule of Object.keys(rules)) {
    if (matches(configRule, rule.selector)) {
      return rules[configRule];
    }
  }

  return undefined;
};

export const getPropertyRule = (rules: FileBasedConfig, decl: any) => {
  for (const key of Object.keys(rules)) {
    if (matches(key, decl.prop)) {
      return rules[key];
    }
  }

  return undefined;
};
