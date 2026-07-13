/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractCreatedFieldNames } from '../pattern_fields';

describe('extractCreatedFieldNames', () => {
  describe('grok patterns (%{SYNTAX:semantic})', () => {
    it('extracts a single grok semantic name', () => {
      expect(extractCreatedFieldNames('"%{NUMBER:duration}"')).toEqual(['duration']);
    });

    it('extracts multiple grok names from one pattern', () => {
      expect(extractCreatedFieldNames('"%{IP:client_ip} %{WORD:method}"')).toEqual([
        'client_ip',
        'method',
      ]);
    });

    it('allows underscores in grok semantic names', () => {
      expect(extractCreatedFieldNames('"%{IP:client_ip}"')).toEqual(['client_ip']);
    });

    it('returns nothing for %{SYNTAX} with no colon (no field created)', () => {
      expect(extractCreatedFieldNames('"%{NUMBER}"')).toEqual([]);
    });

    it('returns nothing for %{SYNTAX:} with empty semantic', () => {
      // Edge case: colon present but no name after it.
      expect(extractCreatedFieldNames('"%{NUMBER:}"')).toEqual([]);
    });

    it('handles grok with leading underscore in semantic name', () => {
      expect(extractCreatedFieldNames('"%{WORD:_private}"')).toEqual(['_private']);
    });
  });

  describe('Java named groups — parse/rex ((?<name>) and (?P<name>))', () => {
    it('extracts a valid Java group name', () => {
      expect(extractCreatedFieldNames('"(?<level>\\\\w+)"')).toEqual(['level']);
    });

    it('extracts the Python (?P<name>) opener', () => {
      expect(extractCreatedFieldNames('"(?P<name>\\\\d+)"')).toEqual(['name']);
    });

    it('excludes names with underscores (invalid Java group name)', () => {
      // The engine rejects this name, so it never becomes a runtime field.
      expect(extractCreatedFieldNames('"(?<user_id>\\\\d+)"')).toEqual([]);
    });

    it('excludes names with dashes', () => {
      expect(extractCreatedFieldNames('"(?<bad-name>\\\\d+)"')).toEqual([]);
    });

    it('excludes names starting with a digit', () => {
      expect(extractCreatedFieldNames('"(?<1name>\\\\d+)"')).toEqual([]);
    });

    it('keeps valid names and drops invalid ones from the same pattern', () => {
      expect(extractCreatedFieldNames('"(?<good>\\\\w+) (?<bad-name>\\\\d+)"')).toEqual(['good']);
    });

    it('extracts multiple valid groups', () => {
      expect(
        extractCreatedFieldNames('"(?<year>\\\\d{4})-(?<month>\\\\d{2})-(?<day>\\\\d{2})"')
      ).toEqual(['year', 'month', 'day']);
    });

    it('extracts the named group even when a lookbehind precedes it', () => {
      // A greedy `[^>]*` opener would consume across the `(?<=...)` lookbehind and
      // never match the real group, dropping `username` and wrongly flagging the
      // field it creates as unknown downstream.
      expect(extractCreatedFieldNames('"(?<=user_)(?<username>\\\\w+)"')).toEqual(['username']);
    });

    it('ignores lookbehind and negative-lookbehind openers (not capture groups)', () => {
      expect(extractCreatedFieldNames('"(?<=foo)(?<!bar)baz"')).toEqual([]);
    });
  });

  describe('mixed grok + Java group in same string (should not happen in practice)', () => {
    it('extracts both types independently', () => {
      // Unlikely but tests that the two regexes don't interfere.
      expect(extractCreatedFieldNames('"%{NUMBER:dur} (?<level>\\\\w+)"')).toEqual([
        'level',
        'dur',
      ]);
    });
  });

  describe('edge cases', () => {
    it('returns empty for a plain string with no captures', () => {
      expect(extractCreatedFieldNames('"hello world"')).toEqual([]);
    });

    it('returns empty for an empty string', () => {
      expect(extractCreatedFieldNames('""')).toEqual([]);
    });

    it('handles regex-special characters in the surrounding pattern', () => {
      expect(extractCreatedFieldNames('"[\\\\[\\\\]](?<ts>\\\\S+)"')).toEqual(['ts']);
    });
  });
});
