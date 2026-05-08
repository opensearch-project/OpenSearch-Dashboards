/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validatePrefix, canAppendWildcard } from './index_data_structure_creator_utils';

describe('validatePrefix', () => {
  test('returns empty string for valid prefix', () => {
    expect(validatePrefix('logs')).toBe('');
    expect(validatePrefix('logs-*')).toBe('');
    expect(validatePrefix('metrics-2024')).toBe('');
  });

  test('returns error for empty prefix', () => {
    expect(validatePrefix('')).toBe('Index prefix cannot be empty');
    expect(validatePrefix('   ')).toBe('Index prefix cannot be empty');
  });

  test('returns error for forbidden characters', () => {
    const error = 'Index prefix cannot contain spaces or special characters: \\ / ? " < > |';

    expect(validatePrefix('logs space')).toBe(error);
    expect(validatePrefix('logs\\test')).toBe(error);
    expect(validatePrefix('logs/test')).toBe(error);
    expect(validatePrefix('logs?test')).toBe(error);
    expect(validatePrefix('logs"test')).toBe(error);
    expect(validatePrefix('logs<test')).toBe(error);
    expect(validatePrefix('logs>test')).toBe(error);
    expect(validatePrefix('logs|test')).toBe(error);
  });
});

describe('canAppendWildcard', () => {
  test('returns true for single alphanumeric characters', () => {
    expect(canAppendWildcard('a')).toBe(true);
    expect(canAppendWildcard('Z')).toBe(true);
    expect(canAppendWildcard('5')).toBe(true);
  });

  test('returns false for invalid input', () => {
    expect(canAppendWildcard('')).toBe(false);
    expect(canAppendWildcard('ab')).toBe(false);
    expect(canAppendWildcard('*')).toBe(false);
    expect(canAppendWildcard(' ')).toBe(false);
    expect(canAppendWildcard('-')).toBe(false);
  });
});
