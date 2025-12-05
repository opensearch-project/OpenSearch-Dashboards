/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nConfig } from './config';

export declare function validateMessageNamespace(
  id: string,
  filePath: string,
  allowedPaths: Record<string, string[]>,
  reporter: unknown
): void;

export declare function matchEntriesWithExctractors(
  inputPath: string,
  options: Record<string, unknown>
): Promise<[[string[], unknown]]>;

export declare function extractMessagesFromPathToMap(
  inputPath: string,
  targetMap: Map<string, { message: string }>,
  config: I18nConfig,
  reporter: any
): Promise<void>;
