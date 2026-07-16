/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  splitFieldPath,
  normalizeFieldPath,
  fieldPathPrefix,
  parseFieldPath,
  normalizeFieldName,
  findLongestTypedPrefix,
} from '../field_path';

describe('splitFieldPath', () => {
  it('splits an unquoted dotted path on every dot', () => {
    expect(splitFieldPath('a.b.c')).toEqual(['a', 'b', 'c']);
  });

  it('keeps a dot inside a backtick-quoted segment together', () => {
    expect(splitFieldPath('`a.b`')).toEqual(['`a.b`']);
  });

  it('keeps a dot inside a quoted leading segment together with a bare tail', () => {
    expect(splitFieldPath('`a.b`.c')).toEqual(['`a.b`', 'c']);
  });

  it('treats a quote appearing mid-segment as a literal character', () => {
    expect(splitFieldPath("a'b.c")).toEqual(["a'b", 'c']);
  });

  it('returns a single segment for a bare name', () => {
    expect(splitFieldPath('total')).toEqual(['total']);
  });
});

describe('normalizeFieldPath', () => {
  it('strips a single backtick pair', () => {
    expect(normalizeFieldPath('`total`')).toBe('total');
  });

  it('strips quotes per segment on a mixed path', () => {
    expect(normalizeFieldPath('a.`b`')).toBe('a.b');
  });

  it('normalizes a quoted segment containing a dot to one segment (the fixed bug)', () => {
    // The old split('.')-first normalizer produced 'a.b' as TWO segments; the
    // quote-aware split keeps it as one quoted name whose unquoted form is 'a.b'.
    expect(normalizeFieldPath('`a.b`')).toBe('a.b');
    expect(splitFieldPath('`a.b`')).toHaveLength(1);
  });

  it('strips single and double quotes (created-name side)', () => {
    expect(normalizeFieldPath("'years'")).toBe('years');
    expect(normalizeFieldPath('"col"')).toBe('col');
  });

  it('leaves an unquoted name unchanged', () => {
    expect(normalizeFieldPath('response')).toBe('response');
  });
});

describe('fieldPathPrefix', () => {
  it('returns null for a single-segment name', () => {
    expect(fieldPathPrefix('response')).toBeNull();
    expect(fieldPathPrefix('`response`')).toBeNull();
  });

  it('returns the unquoted first segment of a dotted path', () => {
    expect(fieldPathPrefix('l.response')).toBe('l');
    expect(fieldPathPrefix('`l`.response')).toBe('l');
  });

  it('treats a quoted leading dot as part of the prefix, not a separator', () => {
    expect(fieldPathPrefix('`a.b`.c')).toBe('a.b');
  });
});

// Pure unit tests for the structured field-path parser (plan §9 "Field paths").
// No grammar/analyzer wiring is involved: these exercise the scan-once, split-on-
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
