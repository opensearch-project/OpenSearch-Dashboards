/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import { coerceToStringFields, fetchIndexMapping, getStringFieldPaths } from './coerce_to_mapping';

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

describe('fetchIndexMapping()', () => {
  const mapping = (properties: Record<string, unknown>) => ({ mappings: { properties } });
  let client: any;
  let logger: { warn: jest.Mock };

  beforeEach(() => {
    client = { indices: { getMapping: jest.fn() } };
    logger = { warn: jest.fn() };
  });

  it('returns the mapping of the named concrete index', async () => {
    client.indices.getMapping.mockResolvedValue({
      body: { idx: mapping({ zip: { type: 'keyword' } }) },
    });
    await expect(fetchIndexMapping(client, 'idx', logger)).resolves.toEqual({
      properties: { zip: { type: 'keyword' } },
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns the single backing index mapping for an alias', async () => {
    client.indices.getMapping.mockResolvedValue({
      body: { 'idx-1': mapping({ zip: { type: 'keyword' } }) },
    });
    await expect(fetchIndexMapping(client, 'my-alias', logger)).resolves.toEqual({
      properties: { zip: { type: 'keyword' } },
    });
  });

  it('returns the shared mapping when every backing index of an alias has the same mapping', async () => {
    client.indices.getMapping.mockResolvedValue({
      body: {
        'idx-1': mapping({
          zip: { type: 'keyword' },
          host: { properties: { ip: { type: 'ip' } } },
        }),
        'idx-2': mapping({
          host: { properties: { ip: { type: 'ip' } } },
          zip: { type: 'keyword' },
        }),
      },
    });
    await expect(fetchIndexMapping(client, 'my-alias', logger)).resolves.toEqual({
      properties: { zip: { type: 'keyword' }, host: { properties: { ip: { type: 'ip' } } } },
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('skips coercion and warns when backing indices of an alias have different mappings', async () => {
    client.indices.getMapping.mockResolvedValue({
      body: {
        'idx-1': mapping({ zip: { type: 'keyword' } }),
        'idx-2': mapping({ zip: { type: 'long' } }),
      },
    });
    await expect(fetchIndexMapping(client, 'my-alias', logger)).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /"my-alias" resolves to 2 indices with different mappings \(idx-1, idx-2\).*without type coercion/
      )
    );
  });

  it('skips coercion without a logger', async () => {
    client.indices.getMapping.mockResolvedValue({
      body: { a: mapping({ x: { type: 'text' } }), b: mapping({ x: { type: 'long' } }) },
    });
    await expect(fetchIndexMapping(client, 'my-alias')).resolves.toBeUndefined();
  });
});
