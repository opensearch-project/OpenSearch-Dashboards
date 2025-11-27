/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  decideScale,
  decideTransform,
  generateTransformLayer,
  generateLabelExpr,
} from './value_mapping_utils';
import { ValueMapping } from '../../types';

// Mock the color utility functions
jest.mock('../../theme/color_utils', () => ({
  getCategoryNextColor: jest.fn((index: number) => `color-${index}`),
  resolveColor: jest.fn((color: string | undefined) => color),
}));

jest.mock('../../theme/default_colors', () => ({
  DEFAULT_GREY: '#808080',
}));

describe('value_mapping_utils', () => {
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
      const result = decideScale('highlightValueMapping', undefined, mockValidValues);

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
      const result = decideTransform('highlightValueMapping');
      expect(result).toBeUndefined();
    });

    it('should return filter transform for filterAll', () => {
      const result = decideTransform('useValueMapping');
      expect(result).toEqual({
        filter: 'datum.mappingValue !== null',
      });
    });
  });

  describe('generateTransformLayer', () => {
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
        'useValueMapping'
      );
      expect(result).toMatchObject([]);
    });

    it('should generate range-based transform when validRanges exist and validValues is empty', () => {
      const result = generateTransformLayer(
        true,
        'numericField',
        mockValidRanges,
        [],
        'useValueMapping'
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
        'useValueMapping'
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
      const result = generateTransformLayer(
        true,
        'field',
        undefined,
        mockValidValues,
        'highlightValueMapping'
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
      const result = generateLabelExpr(mockValidRanges, [], 'useValueMapping');

      expect(result).toBe("{'[0,10)': 'Low Range', '[10,∞)': 'High Range'}[datum.label]");
    });

    it('should generate label expression for values with display text', () => {
      const result = generateLabelExpr(undefined, mockValidValues, 'useValueMapping');

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

      const result = generateLabelExpr(undefined, valuesWithoutDisplay, 'useValueMapping');

      expect(result).toBe("{'A': 'A', 'B': 'B'}[datum.label]");
    });

    it('should add unmatched entry for filterButKeepOpposite', () => {
      const result = generateLabelExpr(undefined, mockValidValues, 'highlightValueMapping');

      expect(result).toBe("{'A': 'Apple Display', 'B': 'B', null: 'unmatched'}[datum.label]");
    });

    it('should prefer values over ranges when both exist', () => {
      const result = generateLabelExpr(mockValidRanges, mockValidValues, 'useValueMapping');

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

      const result = generateLabelExpr(rangeWithoutMax, [], 'useValueMapping');

      expect(result).toBe("{'[5,∞)': 'Above 5'}[datum.label]");
    });
  });
});
