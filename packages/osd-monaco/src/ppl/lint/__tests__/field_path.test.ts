/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseFieldPath, normalizeFieldName, findLongestTypedPrefix } from '../field_path';

// Pure unit tests for the shared field-path parser (plan §9 "Field paths"). No
// grammar/analyzer wiring is involved: these exercise the scan-once, split-on-
// unquoted-dot logic and the longest-typed-prefix lookup directly.

describe('field_path', () => {
  describe('parseFieldPath', () => {
    it('parses a bare name', () => {
      expect(parseFieldPath('status')).toEqual({ segments: ['status'], canonical: 'status' });
    });

    it('splits an unquoted dotted path on every dot', () => {
      expect(parseFieldPath('a.b.c')).toEqual({ segments: ['a', 'b', 'c'], canonical: 'a.b.c' });
    });

    it('strips a backtick-quoted segment', () => {
      expect(parseFieldPath('`status`')).toEqual({ segments: ['status'], canonical: 'status' });
    });

    it('keeps a backtick-quoted dot as ONE segment (the key fix vs split-on-every-dot)', () => {
      const parsed = parseFieldPath('`a.b`');
      expect(parsed).toEqual({ segments: ['a.b'], canonical: 'a.b' });
      expect(parsed?.segments).toHaveLength(1);
    });

    it('handles mixed quoting: a.`b.c` is two segments (a and b.c)', () => {
      const parsed = parseFieldPath('a.`b.c`');
      expect(parsed).toEqual({ segments: ['a', 'b.c'], canonical: 'a.b.c' });
      expect(parsed?.segments).toHaveLength(2);
    });

    it('strips a single-quoted created alias', () => {
      expect(parseFieldPath("'years'")).toEqual({ segments: ['years'], canonical: 'years' });
    });

    it('strips a double-quoted created alias', () => {
      expect(parseFieldPath('"years"')).toEqual({ segments: ['years'], canonical: 'years' });
    });

    it('keeps a doubled-backtick escape verbatim inside the segment', () => {
      // Runtime chars: ` a ` ` b ` — the doubled backtick is an escaped delimiter,
      // so the region stays open and the whole thing is a single segment.
      expect(parseFieldPath('`a``b`')).toEqual({ segments: ['a``b'], canonical: 'a``b' });
    });

    it('keeps a backslash escape (and its escaped delimiter) inside the segment', () => {
      // Runtime chars: ` a \ ` b ` — the backslash escapes the inner backtick so
      // the region closes only on the final backtick, yielding one segment.
      expect(parseFieldPath('`a\\`b`')).toEqual({ segments: ['a\\`b'], canonical: 'a\\`b' });
    });

    it('returns undefined for an unbalanced/unterminated quote', () => {
      expect(parseFieldPath('`abc')).toBeUndefined();
      expect(parseFieldPath("'abc")).toBeUndefined();
    });
  });

  describe('normalizeFieldName', () => {
    it('returns the canonical name for a well-formed reference', () => {
      expect(normalizeFieldName('`a.b`')).toBe('a.b');
      expect(normalizeFieldName('a.b.c')).toBe('a.b.c');
    });

    it('falls back to the raw text on a malformed reference', () => {
      expect(normalizeFieldName('`abc')).toBe('`abc');
    });
  });

  describe('findLongestTypedPrefix', () => {
    it('prefers the longer typed prefix (outer.inner over outer)', () => {
      const typeMap = new Map<string, string>([
        ['outer', 'flat_object'],
        ['outer.inner', 'keyword'],
      ]);
      expect(findLongestTypedPrefix(['outer', 'inner', 'deep'], typeMap)).toEqual({
        path: 'outer.inner',
        type: 'keyword',
      });
    });

    it('falls back to a shorter typed prefix when the longer path is untyped', () => {
      const typeMap = new Map<string, string>([['outer', 'flat_object']]);
      expect(findLongestTypedPrefix(['outer', 'inner'], typeMap)).toEqual({
        path: 'outer',
        type: 'flat_object',
      });
    });

    it('matches a single-segment path', () => {
      expect(findLongestTypedPrefix(['balance'], new Map([['balance', 'long']]))).toEqual({
        path: 'balance',
        type: 'long',
      });
    });

    it('returns undefined when no prefix is typed', () => {
      expect(
        findLongestTypedPrefix(['a', 'b'], new Map<string, string>([['x', 'keyword']]))
      ).toBeUndefined();
      expect(findLongestTypedPrefix(['a', 'b'], new Map<string, string>())).toBeUndefined();
    });
  });
});
