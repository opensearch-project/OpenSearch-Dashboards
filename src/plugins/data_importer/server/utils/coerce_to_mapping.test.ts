/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import { coerceToStringFields, getStringFieldPaths } from './coerce_to_mapping';

describe('getStringFieldPaths()', () => {
  it('collects dotted paths of string-typed fields, including nested objects', () => {
    const mapping: MappingTypeMapping = {
      dynamic: true,
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
        age: { type: 'integer' },
        host: {
          properties: {
            ip: { type: 'ip' },
            zone: { type: 'match_only_text' },
            tag: { type: 'wildcard' },
          },
        },
        env: { type: 'constant_keyword' },
        __lookup: { type: 'keyword' },
      },
    };

    expect(getStringFieldPaths(mapping)).toEqual(
      new Set(['id', 'name', 'host.zone', 'host.tag', 'env', '__lookup'])
    );
  });

  it('returns an empty set for missing or property-less mappings', () => {
    expect(getStringFieldPaths(undefined)).toEqual(new Set());
    expect(getStringFieldPaths({})).toEqual(new Set());
  });
});

describe('coerceToStringFields()', () => {
  const stringFields = new Set(['zip', 'id', 'host.zone', 'a.b']);

  it('converts numbers and booleans in string-typed fields to strings', () => {
    expect(coerceToStringFields({ zip: 2134, id: true, age: 30 }, stringFields)).toEqual({
      zip: '2134',
      id: 'true',
      age: 30,
    });
  });

  it('converts elements of arrays in string-typed fields', () => {
    expect(coerceToStringFields({ zip: [1, '2', 3.5] }, stringFields)).toEqual({
      zip: ['1', '2', '3.5'],
    });
  });

  it('follows nested objects and dotted keys to the same path', () => {
    expect(coerceToStringFields({ host: { zone: 7, other: 8 }, 'a.b': 9 }, stringFields)).toEqual({
      host: { zone: '7', other: 8 },
      'a.b': '9',
    });
  });

  it('passes through fields not declared as strings (incl. undeclared/dynamic fields)', () => {
    const doc = { age: 30, unknown: 5, nested: { x: 1 } };
    expect(coerceToStringFields(doc, stringFields)).toEqual(doc);
  });

  it('leaves strings, nulls and objects in string fields untouched', () => {
    expect(coerceToStringFields({ zip: '02134', id: null }, stringFields)).toEqual({
      zip: '02134',
      id: null,
    });
  });

  it('does not mutate the input and is a no-op with no string fields', () => {
    const doc = { zip: 1 };
    expect(coerceToStringFields(doc, new Set())).toBe(doc);
    coerceToStringFields(doc, stringFields);
    expect(doc).toEqual({ zip: 1 });
  });
});
