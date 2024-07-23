/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { flattenDataHandler, mapFieldTypeToVegaType, mapChartTypeToVegaType } from './helpers';

// Mock the vislibSeriesResponseHandler
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
  });

  describe('mapFieldTypeToVegaType', () => {
    it('should map OpenSearch field types to Vega data types', () => {
      expect(mapFieldTypeToVegaType('number')).toBe('quantitative');
      expect(mapFieldTypeToVegaType('date')).toBe('temporal');
      expect(mapFieldTypeToVegaType('keyword')).toBe('nominal');
      expect(mapFieldTypeToVegaType('unknown')).toBe('nominal');
    });
  });

  describe('mapChartTypeToVegaType', () => {
    it('should map chart types to Vega mark types', () => {
      expect(mapChartTypeToVegaType('histogram')).toBe('bar');
      expect(mapChartTypeToVegaType('line')).toBe('line');
    });
  });
});
