/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  decideScale,
  decideTransform,
  generateTransformLayer,
  generateLabelExpr,
} from './pie_chart_utils';
import { FilterOption, ValueMapping } from '../types';
import { PieChartStyle } from './pie_vis_config';

// Mock the color utility functions
jest.mock('../theme/color_utils', () => ({
  getCategoryNextColor: jest.fn((index: number) => `color-${index}`),
  resolveColor: jest.fn((color: string | undefined) => color),
}));

jest.mock('../theme/default_colors', () => ({
  DEFAULT_GREY: '#808080',
}));

describe('pie_chart_utils', () => {
  describe('decideScale', () => {
    const mockValidRanges: ValueMapping[] = [
      {
        id: '1',
        type: 'range',
        range: { min: 0, max: 10 },
        displayText: 'Low',
        color: '#ff0000',
      },
      {
        id: '2',
        type: 'range',
        range: { min: 10, max: 20 },
        displayText: 'Medium',
        color: '#00ff00',
      },
      {
        id: '3',
        type: 'range',
        range: { min: 20 },
        displayText: 'High',
        color: '#0000ff',
      },
    ];

    const mockValidValues: ValueMapping[] = [
      {
        id: '1',
        type: 'value',
        value: 'A',
        displayText: 'Apple',
        color: '#ff0000',
      },
      {
        id: '2',
        type: 'value',
        value: 'B',
        displayText: 'Banana',
        color: '#00ff00',
      },
    ];

    it('should use ranges when validRanges is not empty', () => {
      const result = decideScale(undefined, mockValidRanges, []);

      expect(result).toEqual({
        domain: ['[0,10)', '[10,20)', '[20,∞)'],
        range: ['#ff0000', '#00ff00', '#0000ff'],
      });
    });

    it('should use validValues when validRanges is not empty', () => {
      const result = decideScale(undefined, undefined, mockValidValues);

      expect(result).toEqual({
        domain: ['A', 'B'],
        range: ['#ff0000', '#00ff00'],
      });
    });

    it('should prefer values over ranges when both exist', () => {
      const result = decideScale(undefined, mockValidRanges, mockValidValues);

      expect(result).toEqual({
        domain: ['A', 'B'],
        range: ['#ff0000', '#00ff00'],
      });
    });

    it('should handle filterButKeepOpposite option by adding null to domain and grey color', () => {
      const result = decideScale('filterButKeepOpposite', undefined, mockValidValues);

      expect(result).toEqual({
        domain: [null, 'A', 'B'],
        range: ['#808080', '#ff0000', '#00ff00'],
      });
    });

    it('should use fallback colors when mapping color is undefined', () => {
      const valuesWithoutColors: ValueMapping[] = [
        { id: '1', type: 'value', value: 'A' },
        { id: '2', type: 'value', value: 'B' },
      ];

      const result = decideScale(undefined, undefined, valuesWithoutColors);

      expect(result).toEqual({
        domain: ['A', 'B'],
        range: ['color-0', 'color-1'],
      });
    });

    it('should handle ranges with undefined max value', () => {
      const rangeWithNoMax: ValueMapping[] = [
        {
          id: '1',
          type: 'range',
          range: { min: 0, max: 10 },
          color: '#ff0000',
        },
        {
          id: '2',
          type: 'range',
          range: { min: 10 },
          color: '#00ff00',
        },
      ];

      const result = decideScale(undefined, rangeWithNoMax, []);

      expect(result).toEqual({
        domain: ['[0,10)', '[10,∞)'],
        range: ['#ff0000', '#00ff00'],
      });
    });
  });

  describe('decideTransform', () => {
    it('should return undefined for filterButKeepOpposite', () => {
      const result = decideTransform('filterButKeepOpposite');
      expect(result).toBeUndefined();
    });

    it('should return filter transform for filterAll', () => {
      const result = decideTransform('filterAll');
      expect(result).toEqual({
        filter: 'datum.mappingValue !== null',
      });
    });
  });

  describe('generateTransformLayer', () => {
    const mockStyleOptions: PieChartStyle = {
      addTooltip: true,
      addLegend: true,
      legendPosition: 'bottom' as any,
      tooltipOptions: { mode: 'all' },
      exclusive: {
        donut: true,
        showValues: false,
        showLabels: false,
        truncate: 100,
      },
      titleOptions: {
        show: false,
        titleName: '',
      },
      filterOption: 'filterAll',
    };

    const mockValidRanges: ValueMapping[] = [
      {
        id: '1',
        type: 'range',
        range: { min: 0, max: 10 },
        displayText: 'Low',
      },
      {
        id: '2',
        type: 'range',
        range: { min: 10 },
        displayText: 'High',
      },
    ];

    const mockValidValues: ValueMapping[] = [
      {
        id: '1',
        type: 'value',
        value: 'A',
        displayText: 'Apple',
      },
    ];

    it('should return empty array when canUseValueMapping is false', () => {
      const result = generateTransformLayer(
        false,
        'field',
        mockValidRanges,
        mockValidValues,
        mockStyleOptions
      );
      expect(result).toMatchObject([]);
    });

    it('should generate range-based transform when validRanges exist and validValues is empty', () => {
      const result = generateTransformLayer(
        true,
        'numericField',
        mockValidRanges,
        [],
        mockStyleOptions
      );

      expect(result[0]).toEqual({
        calculate:
          "(datum['numericField'] >= 0 && datum['numericField'] < 10) ? '[0,10)' : (datum['numericField'] >= 10) ? '[10,∞)' : null",
        as: 'mappingValue',
      });
    });

    it('should generate lookup-based transform when using validValues', () => {
      const result = generateTransformLayer(
        true,
        'field',
        undefined,
        mockValidValues,
        mockStyleOptions
      );

      expect(result).toEqual([
        {
          lookup: 'field',
          from: {
            data: {
              values: [
                {
                  mappingValue: 'A',
                  displayText: 'Apple',
                },
              ],
            },
            key: 'mappingValue',
            fields: ['mappingValue', 'displayText'],
          },
        },
        {
          filter: 'datum.mappingValue !== null',
        },
      ]);
    });

    it('should handle filterButKeepOpposite option correctly', () => {
      const styleWithKeepOpposite = {
        ...mockStyleOptions,
        filterOption: 'filterButKeepOpposite' as FilterOption,
      };

      const result = generateTransformLayer(
        true,
        'field',
        undefined,
        mockValidValues,
        styleWithKeepOpposite
      );

      expect(result).toEqual([
        {
          lookup: 'field',
          from: {
            data: {
              values: [
                {
                  mappingValue: 'A',
                  displayText: 'Apple',
                },
              ],
            },
            key: 'mappingValue',
            fields: ['mappingValue', 'displayText'],
          },
        },
      ]);
    });
  });

  describe('generateLabelExpr', () => {
    const mockStyleOptions: PieChartStyle = {
      addTooltip: true,
      addLegend: true,
      legendPosition: 'bottom' as any,
      tooltipOptions: { mode: 'all' },
      exclusive: {
        donut: true,
        showValues: false,
        showLabels: false,
        truncate: 100,
      },
      titleOptions: {
        show: false,
        titleName: '',
      },
      filterOption: 'filterAll',
    };

    const mockValidRanges: ValueMapping[] = [
      {
        id: '1',
        type: 'range',
        range: { min: 0, max: 10 },
        displayText: 'Low Range',
      },
      {
        id: '2',
        type: 'range',
        range: { min: 10 },
        displayText: 'High Range',
      },
    ];

    const mockValidValues: ValueMapping[] = [
      {
        id: '1',
        type: 'value',
        value: 'A',
        displayText: 'Apple Display',
      },
      {
        id: '2',
        type: 'value',
        value: 'B',
      },
    ];

    it('should generate label expression for ranges with display text', () => {
      const result = generateLabelExpr(mockValidRanges, [], mockStyleOptions);

      expect(result).toBe("{'[0,10)': 'Low Range', '[10,∞)': 'High Range'}[datum.label]");
    });

    it('should generate label expression for values with display text', () => {
      const result = generateLabelExpr(undefined, mockValidValues, mockStyleOptions);

      expect(result).toBe("{'A': 'Apple Display', 'B': 'B'}[datum.label]");
    });

    it('should use default labels when displayText is not provided', () => {
      const valuesWithoutDisplay: ValueMapping[] = [
        {
          id: '1',
          type: 'value',
          value: 'A',
        },
        {
          id: '2',
          type: 'value',
          value: 'B',
        },
      ];

      const result = generateLabelExpr(undefined, valuesWithoutDisplay, mockStyleOptions);

      expect(result).toBe("{'A': 'A', 'B': 'B'}[datum.label]");
    });

    it('should add unmatched entry for filterButKeepOpposite', () => {
      const styleWithKeepOpposite = {
        ...mockStyleOptions,
        filterOption: 'filterButKeepOpposite' as FilterOption,
      };

      const result = generateLabelExpr(undefined, mockValidValues, styleWithKeepOpposite);

      expect(result).toBe("{'A': 'Apple Display', 'B': 'B', null: 'unmatched'}[datum.label]");
    });

    it('should prefer values over ranges when both exist', () => {
      const result = generateLabelExpr(mockValidRanges, mockValidValues, mockStyleOptions);

      expect(result).toBe("{'A': 'Apple Display', 'B': 'B'}[datum.label]");
    });

    it('should handle ranges without max value correctly', () => {
      const rangeWithoutMax: ValueMapping[] = [
        {
          id: '1',
          type: 'range',
          range: { min: 5 },
          displayText: 'Above 5',
        },
      ];

      const result = generateLabelExpr(rangeWithoutMax, [], mockStyleOptions);

      expect(result).toBe("{'[5,∞)': 'Above 5'}[datum.label]");
    });
  });
});
