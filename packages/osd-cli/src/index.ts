/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export { main, parseArgs } from './cli';
export { loadConfig, getActiveProfile } from './config';
export { OsdClient, ClientError } from './client';
export type {
  OsdctlConfig,
  ProfileConfig,
  LintRuleConfig,
} from './config';
export type {
  SavedObject,
  ValidationResult,
  DiffResult,
  ApplyResult,
} from './client';
