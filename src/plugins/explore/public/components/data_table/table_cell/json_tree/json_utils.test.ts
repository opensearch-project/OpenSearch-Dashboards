/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { containsTerm, extractHighlightTerms, findFieldForLeaf, tryParseJson } from './json_utils';

describe('tryParseJson', () => {
  it('parses JSON object and array strings', () => {
    expect(tryParseJson('{"a":1}')).toEqual({ a: 1 });
    expect(tryParseJson('  [1,2]  ')).toEqual([1, 2]);
  });

  it('passes through objects and arrays', () => {
    const obj = { a: 1 };
    expect(tryParseJson(obj)).toBe(obj);
    expect(tryParseJson([1])).toEqual([1]);
  });

  it('returns undefined for non-JSON values', () => {
    expect(tryParseJson('hello')).toBeUndefined();
    expect(tryParseJson('{not json')).toBeUndefined();
    expect(tryParseJson('123')).toBeUndefined();
    expect(tryParseJson('"quoted"')).toBeUndefined();
    expect(tryParseJson('{}extra')).toBeUndefined();
    expect(tryParseJson(42)).toBeUndefined();
    expect(tryParseJson(null)).toBeUndefined();
    expect(tryParseJson(undefined)).toBeUndefined();
  });

  it('ignores oversized strings', () => {
    expect(tryParseJson(`{"a":"${'x'.repeat(100001)}"}`)).toBeUndefined();
  });
});

describe('findFieldForLeaf', () => {
  const flattened = {
    payload: '{...}',
    'payload_parsed.order_id': 1001,
    'payload_parsed.customer.name': 'Ada',
    'payload_parsed.items.sku': ['A1', 'B7'],
    'other.customer.name': 'Bob',
    'a.id': 1,
    'b.id': 1,
    'col.x': 5,
    'elsewhere.x': 7,
  };

  it('finds a field whose name ends with the path and holds the same value', () => {
    expect(findFieldForLeaf(flattened, 'payload', ['order_id'], 1001)).toBe(
      'payload_parsed.order_id'
    );
    expect(findFieldForLeaf(flattened, 'payload', ['customer', 'name'], 'Ada')).toBe(
      'payload_parsed.customer.name'
    );
  });

  it('matches a value inside an array field', () => {
    expect(findFieldForLeaf(flattened, 'payload', ['items', 'sku'], 'B7')).toBe(
      'payload_parsed.items.sku'
    );
  });

  it('prefers <column>.<path> and does not fall back when its value differs', () => {
    expect(findFieldForLeaf(flattened, 'col', ['x'], 5)).toBe('col.x');
    expect(findFieldForLeaf(flattened, 'col', ['x'], 7)).toBeUndefined();
  });

  it('returns undefined when no field, a different value, or several fields match', () => {
    expect(findFieldForLeaf(flattened, 'payload', ['missing'], 1)).toBeUndefined();
    expect(findFieldForLeaf(flattened, 'payload', ['order_id'], '1001')).toBeUndefined();
    expect(findFieldForLeaf(flattened, 'payload', ['id'], 1)).toBeUndefined();
  });

  it('returns undefined for the root and for non-primitive values', () => {
    expect(findFieldForLeaf(flattened, 'payload', [], 1001)).toBeUndefined();
    expect(findFieldForLeaf(flattened, 'payload', ['customer'], { name: 'Ada' })).toBeUndefined();
  });
});

describe('extractHighlightTerms', () => {
  it('returns the distinct marked texts, decoded', () => {
    expect(
      extractHighlightTerms(
        '{"a":"<mark>foo</mark>","b":"<mark>a &amp; b</mark> <mark>foo</mark>"}'
      )
    ).toEqual(['foo', 'a & b']);
  });

  it('returns nothing without marks or for non-strings', () => {
    expect(extractHighlightTerms('{"a":"foo"}')).toEqual([]);
    expect(extractHighlightTerms(undefined)).toEqual([]);
  });
});

describe('containsTerm', () => {
  it('finds a term in a string or anywhere inside an object or array', () => {
    expect(containsTerm('upstream timeout', ['timeout'])).toBe(true);
    expect(containsTerm({ error: { detail: 'upstream timeout' } }, ['timeout'])).toBe(true);
    expect(containsTerm([{ status: 'in_transit' }], ['transit'])).toBe(true);
  });

  it('returns false without a match or without terms', () => {
    expect(containsTerm({ a: 'b' }, ['zzz'])).toBe(false);
    expect(containsTerm({ a: 'b' }, [])).toBe(false);
    expect(containsTerm(undefined, ['a'])).toBe(false);
  });
});
