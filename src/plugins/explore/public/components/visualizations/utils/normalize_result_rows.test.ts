/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeResultRows } from './normalize_result_rows';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { VisFieldType } from '../types';

describe('normalizeResultRows', () => {
  describe('with empty inputs', () => {
    it('should handle empty rows and schema', () => {
      const result = normalizeResultRows([], []);
      expect(result).toEqual({
        transformedData: [],
        numericalColumns: [],
        categoricalColumns: [],
        dateColumns: [],
      });
    });

    it('should handle empty rows with valid schema', () => {
      const schema = [
        { type: 'number', name: 'count' },
        { type: 'string', name: 'category' },
      ];
      const result = normalizeResultRows([], schema);

      expect(result.transformedData).toEqual([]);
      expect(result.numericalColumns).toHaveLength(1);
      expect(result.categoricalColumns).toHaveLength(1);
      expect(result.dateColumns).toHaveLength(0);
    });

    it('should handle valid rows with empty schema', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { count: 10, category: 'A' },
        },
      ];
      const result = normalizeResultRows(rows, []);

      expect(result).toEqual({
        transformedData: [{}],
        numericalColumns: [],
        categoricalColumns: [],
        dateColumns: [],
      });
    });
  });

  describe('with basic data transformation', () => {
    it('should transform rows and create columns correctly', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { count: 10, category: 'A', timestamp: '2023-01-01' },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: { count: 20, category: 'B', timestamp: '2023-01-02' },
        },
      ];

      const schema = [
        { type: 'number', name: 'count' },
        { type: 'string', name: 'category' },
        { type: 'date', name: 'timestamp' },
      ];

      const result = normalizeResultRows(rows, schema);

      expect(result.transformedData).toEqual([
        { count: 10, category: 'A', timestamp: '2023-01-01' },
        { count: 20, category: 'B', timestamp: '2023-01-02' },
      ]);

      expect(result.numericalColumns).toHaveLength(1);
      expect(result.categoricalColumns).toHaveLength(1);
      expect(result.dateColumns).toHaveLength(1);
    });

    it('should handle field name normalization', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { 'machine.os': 'linux', 'user[name]': 'john' },
        },
      ];

      const schema = [
        { type: 'string', name: 'machine.os' },
        { type: 'string', name: 'user[name]' },
      ];

      const result = normalizeResultRows(rows, schema);

      // Check that field names are normalized in column definitions
      expect(result.categoricalColumns[0].column).toBe('machine_os');
      expect(result.categoricalColumns[1].column).toBe('user(name)');

      // Check that original field names are preserved for data access
      expect(result.categoricalColumns[0].name).toBe('machine.os');
      expect(result.categoricalColumns[1].name).toBe('user[name]');
    });
  });

  describe('with field type mapping', () => {
    it('should map known field types correctly', () => {
      const schema = [
        { type: 'number', name: 'numerical_field' },
        { type: 'string', name: 'categorical_field' },
        { type: 'date', name: 'date_field' },
        { type: 'boolean', name: 'boolean_field' },
      ];

      const result = normalizeResultRows([], schema);

      expect(result.numericalColumns[0].schema).toBe(VisFieldType.Numerical);
      expect(result.categoricalColumns[0].schema).toBe(VisFieldType.Categorical);
      expect(result.dateColumns[0].schema).toBe(VisFieldType.Date);
      expect(result.categoricalColumns[1].schema).toBe(VisFieldType.Categorical); // boolean maps to categorical
    });

    it('should handle unknown field types', () => {
      const schema = [
        { type: 'unknown_type', name: 'unknown_field' },
        { type: undefined, name: 'undefined_type_field' },
        { name: 'no_type_field' },
      ];

      const result = normalizeResultRows([], schema);

      const allColumns = [
        ...result.numericalColumns,
        ...result.categoricalColumns,
        ...result.dateColumns,
      ];

      // All should be mapped to Unknown type and filtered out from specific type arrays
      expect(allColumns).toHaveLength(0);
    });

    it('should handle missing field names', () => {
      const schema = [
        { type: 'string', name: undefined },
        { type: 'number' }, // no name property
      ];

      const result = normalizeResultRows([], schema);

      const allColumns = [
        ...result.numericalColumns,
        ...result.categoricalColumns,
        ...result.dateColumns,
      ];

      expect(allColumns).toHaveLength(0);
    });
  });

  describe('with statistics calculation', () => {
    it('should calculate valid and unique values correctly', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { count: 10, category: 'A' },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: { count: 20, category: 'A' },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: { count: 30, category: 'B' },
        },
      ];

      const schema = [
        { type: 'number', name: 'count' },
        { type: 'string', name: 'category' },
      ];

      const result = normalizeResultRows(rows, schema);

      const countColumn = result.numericalColumns[0];
      const categoryColumn = result.categoricalColumns[0];

      expect(countColumn.validValuesCount).toBe(3);
      expect(countColumn.uniqueValuesCount).toBe(3);

      expect(categoryColumn.validValuesCount).toBe(3);
      expect(categoryColumn.uniqueValuesCount).toBe(2); // 'A' and 'B'
    });

    it('should handle null and undefined values in statistics', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { count: 10, category: 'A' },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: { count: null, category: undefined },
        },
        {
          _index: 'test',
          _id: '3',
          _score: 1,
          _source: { count: 10, category: 'A' },
        },
      ];

      const schema = [
        { type: 'number', name: 'count' },
        { type: 'string', name: 'category' },
      ];

      const result = normalizeResultRows(rows, schema);

      const countColumn = result.numericalColumns[0];
      const categoryColumn = result.categoricalColumns[0];

      expect(countColumn.validValuesCount).toBe(2); // excludes null
      expect(countColumn.uniqueValuesCount).toBe(1); // only '10'

      expect(categoryColumn.validValuesCount).toBe(2); // excludes undefined
      expect(categoryColumn.uniqueValuesCount).toBe(1); // only 'A'
    });

    it('should handle missing fields in source data', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { count: 10 }, // missing 'category' field
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: { category: 'A' }, // missing 'count' field
        },
      ];

      const schema = [
        { type: 'number', name: 'count' },
        { type: 'string', name: 'category' },
      ];

      const result = normalizeResultRows(rows, schema);

      expect(result.transformedData).toEqual([
        { count: 10, category: undefined },
        { count: undefined, category: 'A' },
      ]);

      const countColumn = result.numericalColumns[0];
      const categoryColumn = result.categoricalColumns[0];

      expect(countColumn.validValuesCount).toBe(1);
      expect(categoryColumn.validValuesCount).toBe(1);
    });
  });

  describe('with column categorization', () => {
    it('should categorize columns by field type correctly', () => {
      const schema = [
        { type: 'number', name: 'price' },
        { type: 'float', name: 'rating' },
        { type: 'string', name: 'name' },
        { type: 'keyword', name: 'status' },
        { type: 'date', name: 'created_at' },
        { type: 'date_nanos', name: 'updated_at' },
      ];

      const result = normalizeResultRows([], schema);

      expect(result.numericalColumns).toHaveLength(2);
      expect(result.categoricalColumns).toHaveLength(2);
      expect(result.dateColumns).toHaveLength(2);

      expect(result.numericalColumns.map((col) => col.name)).toEqual(['price', 'rating']);
      expect(result.categoricalColumns.map((col) => col.name)).toEqual(['name', 'status']);
      expect(result.dateColumns.map((col) => col.name)).toEqual(['created_at', 'updated_at']);
    });

    it('should create proper column structure', () => {
      const schema = [{ type: 'number', name: 'test_field' }];
      const result = normalizeResultRows([], schema);

      const column = result.numericalColumns[0];

      expect(column).toEqual({
        id: 0,
        schema: VisFieldType.Numerical,
        name: 'test_field',
        column: 'test_field', // normalized field name
        validValuesCount: 0,
        uniqueValuesCount: 0,
      });
    });
  });

  describe('with complex data scenarios', () => {
    it('should handle nested object data', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: {
            'user.name': 'John',
            'user.age': 30,
            'metrics.cpu': 0.8,
          } as any,
        },
      ];

      const schema = [
        { type: 'string', name: 'user.name' },
        { type: 'number', name: 'user.age' },
        { type: 'float', name: 'metrics.cpu' },
      ];

      const result = normalizeResultRows(rows, schema);

      expect(result.transformedData[0]).toEqual({
        user_name: 'John',
        user_age: 30,
        metrics_cpu: 0.8,
      });
    });
  });

  describe('handle empty/zero value properly', () => {
    it('should handle zero values correctly in statistics', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { count: 0, flag: false },
        },
      ];

      const schema = [
        { type: 'number', name: 'count' },
        { type: 'boolean', name: 'flag' },
      ];

      const result = normalizeResultRows(rows, schema);

      const countColumn = result.numericalColumns[0];
      const flagColumn = result.categoricalColumns[0];

      expect(countColumn.validValuesCount).toBe(1); // 0 is a valid value
      expect(flagColumn.validValuesCount).toBe(1); // false is a valid value
    });

    it('should handle empty string values in statistics', () => {
      const rows: OpenSearchSearchHit[] = [
        {
          _index: 'test',
          _id: '1',
          _score: 1,
          _source: { name: '', category: 'A' },
        },
        {
          _index: 'test',
          _id: '2',
          _score: 1,
          _source: { name: 'John', category: '' },
        },
      ];

      const schema = [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'category' },
      ];

      const result = normalizeResultRows(rows, schema);

      const nameColumn = result.categoricalColumns[0];
      const categoryColumn = result.categoricalColumns[1];

      expect(nameColumn.validValuesCount).toBe(2); // empty string is valid
      expect(nameColumn.uniqueValuesCount).toBe(2); // '' and 'John'
      expect(categoryColumn.validValuesCount).toBe(2);
      expect(categoryColumn.uniqueValuesCount).toBe(2); // 'A' and ''
    });
  });
});
