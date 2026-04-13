/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { transformToMultiSeriesWithSize } from './scatter_chart_utils';

describe('transformToMultiSeriesWithSize', () => {
  const header = ['x', 'y', 'color', 'size'];

  const buildData = (rows: any[][]) => [header, ...rows];

  describe('basic functionality', () => {
    it('groups data by color category and returns correct sizeRange', () => {
      const data = buildData([
        [1, 10, 'A', 5],
        [2, 20, 'B', 15],
        [3, 30, 'A', 10],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.categories).toEqual(['A', 'B']);
      expect(result.seriesData['A']).toEqual([
        [1, 10, 5],
        [3, 30, 10],
      ]);
      expect(result.seriesData['B']).toEqual([[2, 20, 15]]);
      expect(result.sizeRange).toEqual({ min: 5, max: 15 });
    });
  });

  describe('zero and negative size values', () => {
    it('includes data points with size = 0', () => {
      const data = buildData([
        [1, 10, 'A', 0],
        [2, 20, 'A', 5],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.seriesData['A']).toEqual([
        [1, 10, 0],
        [2, 20, 5],
      ]);
      expect(result.sizeRange).toEqual({ min: 0, max: 5 });
    });

    it('includes data points with negative size values', () => {
      const data = buildData([
        [1, 10, 'A', -3],
        [2, 20, 'A', 7],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.seriesData['A']).toEqual([
        [1, 10, -3],
        [2, 20, 7],
      ]);
      expect(result.sizeRange).toEqual({ min: -3, max: 7 });
    });

    it('handles all-zero sizes', () => {
      const data = buildData([
        [1, 10, 'A', 0],
        [2, 20, 'B', 0],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.seriesData['A']).toEqual([[1, 10, 0]]);
      expect(result.seriesData['B']).toEqual([[2, 20, 0]]);
      expect(result.sizeRange).toEqual({ min: 0, max: 0 });
    });
  });

  describe('NaN size filtering', () => {
    it('skips rows where size is NaN', () => {
      const data = buildData([
        [1, 10, 'A', NaN],
        [2, 20, 'A', 5],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.seriesData['A']).toEqual([[2, 20, 5]]);
      expect(result.sizeRange).toEqual({ min: 5, max: 5 });
    });

    it('skips rows where size is a non-numeric string', () => {
      const data = buildData([
        [1, 10, 'A', 'abc'],
        [2, 20, 'A', 8],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.seriesData['A']).toEqual([[2, 20, 8]]);
      expect(result.sizeRange).toEqual({ min: 8, max: 8 });
    });
  });

  describe('no valid data points (empty sizeRange fallback)', () => {
    it('returns sizeRange { min: 0, max: 0 } when all sizes are NaN', () => {
      const data = buildData([
        [1, 10, 'A', NaN],
        [2, 20, 'B', NaN],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.sizeRange).toEqual({ min: 0, max: 0 });
      expect(result.seriesData['A']).toEqual([]);
      expect(result.seriesData['B']).toEqual([]);
    });

    it('returns sizeRange { min: 0, max: 0 } when all sizes are non-numeric strings', () => {
      const data = buildData([
        [1, 10, 'A', 'foo'],
        [2, 20, 'A', 'bar'],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.sizeRange).toEqual({ min: 0, max: 0 });
      expect(result.seriesData['A']).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('throws when transformedData has no rows', () => {
      expect(() => transformToMultiSeriesWithSize([], 'x', 'y', 'color', 'size')).toThrow(
        'transformedData must have at least header and one data row'
      );
    });

    it('throws when transformedData has only a header', () => {
      expect(() => transformToMultiSeriesWithSize([header], 'x', 'y', 'color', 'size')).toThrow(
        'transformedData must have at least header and one data row'
      );
    });

    it('throws when a field name is not found in the header', () => {
      const data = buildData([[1, 10, 'A', 5]]);
      expect(() =>
        transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'missing_field')
      ).toThrow('Cannot find field indices');
    });
  });

  describe('edge cases', () => {
    it('maps null/undefined color values to "undefined" category', () => {
      const data = buildData([
        [1, 10, null, 5],
        [2, 20, undefined, 10],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.categories).toEqual(['undefined']);
      expect(result.seriesData['undefined']).toEqual([
        [1, 10, 5],
        [2, 20, 10],
      ]);
    });

    it('filters NaN sizes in some categories while keeping zero sizes in others', () => {
      const data = buildData([
        [1, 10, 'A', 0],
        [2, 20, 'A', NaN],
        [3, 30, 'B', NaN],
        [4, 40, 'B', -2],
      ]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.seriesData['A']).toEqual([[1, 10, 0]]);
      expect(result.seriesData['B']).toEqual([[4, 40, -2]]);
      expect(result.sizeRange).toEqual({ min: -2, max: 0 });
    });

    it('handles a single data row with size = 0', () => {
      const data = buildData([[5, 50, 'X', 0]]);

      const result = transformToMultiSeriesWithSize(data, 'x', 'y', 'color', 'size');

      expect(result.categories).toEqual(['X']);
      expect(result.seriesData['X']).toEqual([[5, 50, 0]]);
      expect(result.sizeRange).toEqual({ min: 0, max: 0 });
    });
  });
});
