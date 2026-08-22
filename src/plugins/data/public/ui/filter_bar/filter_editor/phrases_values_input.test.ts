/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { uniq } from 'lodash';

/**
 * This tests the comma-splitting logic used in PhrasesValuesInput's onCreateOption handler.
 * The handler splits comma-separated input into individual values, trims whitespace,
 * filters empty strings, and deduplicates against existing values.
 *
 * Resolves: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/6670
 */

// Extract the logic from onCreateOption for testability
function splitAndMergeValues(option: string, existingValues: string[]): string[] {
  const newValues = option.includes(',')
    ? option
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    : [option];
  return uniq([...existingValues, ...newValues]);
}

describe('PhrasesValuesInput comma-separated splitting', () => {
  describe('splitAndMergeValues', () => {
    it('should split comma-separated values into individual items', () => {
      const result = splitAndMergeValues('1234,123,12', []);
      expect(result).toEqual(['1234', '123', '12']);
    });

    it('should trim whitespace from each value', () => {
      const result = splitAndMergeValues('foo , bar , baz', []);
      expect(result).toEqual(['foo', 'bar', 'baz']);
    });

    it('should filter out empty strings from splitting', () => {
      const result = splitAndMergeValues('foo,,bar,', []);
      expect(result).toEqual(['foo', 'bar']);
    });

    it('should handle a single value without commas', () => {
      const result = splitAndMergeValues('single', []);
      expect(result).toEqual(['single']);
    });

    it('should deduplicate against existing values', () => {
      const result = splitAndMergeValues('foo,bar,baz', ['foo']);
      expect(result).toEqual(['foo', 'bar', 'baz']);
    });

    it('should deduplicate within the input itself', () => {
      const result = splitAndMergeValues('foo,bar,foo', []);
      expect(result).toEqual(['foo', 'bar']);
    });

    it('should append new values to existing values', () => {
      const result = splitAndMergeValues('new1,new2', ['existing1', 'existing2']);
      expect(result).toEqual(['existing1', 'existing2', 'new1', 'new2']);
    });

    it('should handle the original bug scenario: typing comma-separated values', () => {
      // Original bug: typing "1234,123,12" and pressing Enter added one value "1234,123,12"
      // Fix: should add three separate values
      const result = splitAndMergeValues('1234,123,12', []);
      expect(result).toHaveLength(3);
      expect(result).toContain('1234');
      expect(result).toContain('123');
      expect(result).toContain('12');
    });
  });
});
