/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisFieldType } from '../types';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { normalizeResultRows } from './normalize_result_rows';

jest.mock('./normalize_result_rows', () => {
  const originalModule = jest.requireActual('./normalize_result_rows');
  return {
    ...originalModule,
    normalizeDateString: jest.fn((value: string): string => {
      if (!value) return value;
      if (value.includes('T') && value.endsWith('Z')) {
        return value;
      }
      return value.replace(' ', 'T') + 'Z';
    }),
  };
});

describe('normalizeResultRows', () => {
  // Sample schema for testing
  const schema = [
    { type: 'number', name: 'age' },
    { type: 'string', name: 'name' },
    { type: 'date', name: 'created_at' },
    { type: 'unknown', name: 'unknown_field' },
  ];

  // Sample OpenSearch search hits with required properties
  const rows: Array<OpenSearchSearchHit<unknown>> = [
    {
      _index: 'test-index',
      _id: '1',
      _score: 1.0,
      _source: {
        age: 30,
        name: 'Alice',
        created_at: '2023-10-01 12:00:00',
        unknown_field: null,
      },
    },
    {
      _index: 'test-index',
      _id: '2',
      _score: 1.0,
      _source: {
        age: 25,
        name: 'Bob',
        created_at: '2023-10-02 14:30:00',
        unknown_field: 'test',
      },
    },
    {
      _index: 'test-index',
      _id: '3',
      _score: 1.0,
      _source: {
        age: null,
        name: 'Alice',
        created_at: null,
        unknown_field: undefined,
      },
    },
  ];

  it('should correctly transform rows and normalize date strings', () => {
    const result = normalizeResultRows(rows, schema);

    // Check transformedData
    expect(result.transformedData).toEqual([
      {
        'field-0': 30,
        'field-1': 'Alice',
        'field-2': '2023-10-01T12:00:00Z',
        'field-3': null,
      },
      {
        'field-0': 25,
        'field-1': 'Bob',
        'field-2': '2023-10-02T14:30:00Z',
        'field-3': 'test',
      },
      {
        'field-0': null,
        'field-1': 'Alice',
        'field-2': null,
        'field-3': undefined,
      },
    ]);

    // Check column metadata
    expect(result.numericalColumns).toHaveLength(1);
    expect(result.numericalColumns[0]).toMatchObject({
      id: 0,
      schema: VisFieldType.Numerical,
      name: 'age',
      column: 'field-0',
      validValuesCount: 2,
      uniqueValuesCount: 2,
    });

    expect(result.categoricalColumns).toHaveLength(1);
    expect(result.categoricalColumns[0]).toMatchObject({
      id: 1,
      schema: VisFieldType.Categorical,
      name: 'name',
      column: 'field-1',
      validValuesCount: 3,
      uniqueValuesCount: 2,
    });

    expect(result.dateColumns).toHaveLength(1);
    expect(result.dateColumns[0]).toMatchObject({
      id: 2,
      schema: VisFieldType.Date,
      name: 'created_at',
      column: 'field-2',
      validValuesCount: 2,
      uniqueValuesCount: 2,
    });

    expect(result.transformedData[0]['field-2']).toBe('2023-10-01T12:00:00Z');
    expect(result.transformedData[1]['field-2']).toBe('2023-10-02T14:30:00Z');
  });

  it('should handle empty rows', () => {
    const result = normalizeResultRows([], schema);
    expect(result.transformedData).toEqual([]);
    expect(result.numericalColumns[0].validValuesCount).toBe(0);
    expect(result.numericalColumns[0].uniqueValuesCount).toBe(0);
    expect(result.categoricalColumns[0].validValuesCount).toBe(0);
    expect(result.dateColumns[0].validValuesCount).toBe(0);
  });

  it('should handle missing schema types', () => {
    const schemaWithMissingType = [{ name: 'test' }];
    const rowsWithMissingType: Array<OpenSearchSearchHit<unknown>> = [
      {
        _index: 'test-index',
        _id: '1',
        _score: 1.0,
        _source: { test: 'value' },
      },
    ];
    const result = normalizeResultRows(rowsWithMissingType, schemaWithMissingType);
    expect(result.transformedData).toEqual([{ 'field-0': 'value' }]);
    expect(result.numericalColumns).toHaveLength(0);
    expect(result.categoricalColumns).toHaveLength(0);
    expect(result.dateColumns).toHaveLength(0);
  });
});

describe('normalizeDateString', () => {
  const { normalizeDateString } = jest.requireActual('./normalize_result_rows');

  it('should return empty string for empty input', () => {
    expect(normalizeDateString('')).toBe('');
  });

  it('should not modify valid ISO 8601 date string', () => {
    expect(normalizeDateString('2023-10-01T12:00:00Z')).toBe('2023-10-01T12:00:00Z');
  });

  it('should normalize space-separated date string to ISO 8601 with Z', () => {
    expect(normalizeDateString('2023-10-01 12:00:00')).toBe('2023-10-01T12:00:00Z');
  });

  it('should append Z to date string without timezone', () => {
    expect(normalizeDateString('2023-10-01T12:00:00')).toBe('2023-10-01T12:00:00Z');
  });
});
