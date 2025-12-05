/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { flattenDataHandler, mapFieldTypeToVegaType, mapChartTypeToVegaType } from './helpers';

// Mock the vislibSeriesResponseHandler and vislibSlicesResponseHandler
jest.mock('../../../../../vis_type_vislib/public', () => ({
  vislibSeriesResponseHandler: jest.fn((context, dimensions) => {
    if (dimensions.splitRow || dimensions.splitColumn) {
      return {
        rows: context.rows,
      };
    } else {
      return {
        series: context.series,
      };
    }
  }),
  vislibSlicesResponseHandler: jest.fn((context) => {
    return {
      slices: context.slices,
    };
  }),
}));

describe('helpers.ts', () => {
  describe('flattenDataHandler', () => {
    it('should flatten series data correctly with split', () => {
      const context = {
        rows: [
          {
            label: 'Group 1',
            series: [
              {
                label: 'Series 1',
                values: [
                  { x: 1, y: 10 },
                  { x: 2, y: 20 },
                ],
              },
            ],
          },
        ],
      };
      const dimensions = { splitRow: [{}] };
      const result = flattenDataHandler(context, dimensions);

      expect(result.series).toHaveLength(2);
      expect(result.series[0]).toEqual({ x: 1, y: 10, series: 'Series 1', split: 'Group 1' });
      expect(result.series[1]).toEqual({ x: 2, y: 20, series: 'Series 1', split: 'Group 1' });
    });

    it('should handle series without split', () => {
      const context = {
        series: [
          {
            label: 'Series 1',
            values: [
              { x: 1, y: 10 },
              { x: 2, y: 20 },
            ],
          },
        ],
      };
      const dimensions = {};
      const result = flattenDataHandler(context, dimensions);

      expect(result.series).toHaveLength(2);
      expect(result.series[0]).toEqual({ x: 1, y: 10, series: 'Series 1' });
      expect(result.series[1]).toEqual({ x: 2, y: 20, series: 'Series 1' });
    });

    it('should flatten slice data correctly', () => {
      const context = {
        slices: {
          children: [
            {
              name: 'Category A',
              children: [
                { name: 'Subcategory 1', size: 10 },
                { name: 'Subcategory 2', size: 20 },
              ],
            },
          ],
        },
      };
      const dimensions = {};
      const result = flattenDataHandler(context, dimensions, 'slices');

      expect(result.slices).toHaveLength(2);
      expect(result.slices[0]).toEqual({
        level1: 'Category A',
        level2: 'Subcategory 1',
        value: 10,
      });
      expect(result.slices[1]).toEqual({
        level1: 'Category A',
        level2: 'Subcategory 2',
        value: 20,
      });
      expect(result.levels).toEqual(['level1', 'level2']);
    });

    it('should handle slice data with splits', () => {
      const context = {
        slices: {
          children: [
            {
              name: 'Category A',
              children: [{ name: 'Subcategory 1', size: 10 }],
            },
          ],
        },
      };
      const dimensions = { splitRow: [{}] };
      const result = flattenDataHandler(context, dimensions, 'slices');

      expect(result.slices).toHaveLength(1);
      expect(result.slices[0]).toEqual({
        level1: 'Category A',
        level2: 'Subcategory 1',
        value: 10,
        split: undefined,
      });
    });

    it('should handle z-values in series data', () => {
      const context = {
        series: [
          {
            label: 'Series 1',
            values: [
              { x: 1, y: 10, z: 5 },
              { x: 2, y: 20, z: 10 },
            ],
          },
        ],
      };
      const dimensions = {};
      const result = flattenDataHandler(context, dimensions);

      expect(result.series).toHaveLength(2);
      expect(result.series[0]).toEqual({ x: 1, y: 10, z: 5, series: 'Series 1' });
      expect(result.series[1]).toEqual({ x: 2, y: 20, z: 10, series: 'Series 1' });
    });

    it('should throw an error if series values are not an array', () => {
      const context = {
        series: [
          {
            label: 'Series 1',
            values: 'not an array',
          },
        ],
      };
      const dimensions = {};

      expect(() => flattenDataHandler(context, dimensions)).toThrow(
        'Each series must have a "values" array'
      );
    });
  });

  describe('mapFieldTypeToVegaType', () => {
    it('should map OpenSearch field types to Vega data types', () => {
      expect(mapFieldTypeToVegaType('number')).toBe('quantitative');
      expect(mapFieldTypeToVegaType('date')).toBe('temporal');
      expect(mapFieldTypeToVegaType('time')).toBe('temporal');
      expect(mapFieldTypeToVegaType('terms')).toBe('nominal');
      expect(mapFieldTypeToVegaType('keyword')).toBe('nominal');
      expect(mapFieldTypeToVegaType('ip')).toBe('nominal');
      expect(mapFieldTypeToVegaType('boolean')).toBe('nominal');
      expect(mapFieldTypeToVegaType('histogram')).toBe('quantitative');
      expect(mapFieldTypeToVegaType('unknown')).toBe('nominal');
    });
  });

  describe('mapChartTypeToVegaType', () => {
    it('should map chart types to Vega mark types', () => {
      expect(mapChartTypeToVegaType('histogram')).toBe('bar');
      expect(mapChartTypeToVegaType('line')).toBe('line');
      expect(mapChartTypeToVegaType('area')).toBe('area');
      expect(mapChartTypeToVegaType('bar')).toBe('bar');
      expect(mapChartTypeToVegaType('pie')).toBe('pie');
    });
  });
});
