/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { splitFieldPath, normalizeFieldPath, fieldPathPrefix } from '../field_path';

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
