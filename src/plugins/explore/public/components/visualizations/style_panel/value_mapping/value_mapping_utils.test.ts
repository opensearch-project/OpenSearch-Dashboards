/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  decideScale,
  decideTransform,
  generateTransformLayer,
  generateLabelExpr,
  processData,
} from './value_mapping_utils';
import { ValueMapping } from '../../types';
import { CalculationMethod } from '../../utils/calculation';

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

    it('should accept both values and ranges when both exist', () => {
      const result = decideScale(undefined, mockValidRanges, mockValidValues);

      expect(result).toEqual({
        domain: ['A', 'B', '[0,10)', '[10,20)', '[20,∞)'],
        range: ['#ff0000', '#00ff00', '#ff0000', '#00ff00', '#0000ff'],
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
        lookup: 'mergedLabel',
        from: {
          data: {
            values: [
              { mappingValue: '[0,10)', displayText: 'Low' },
              { mappingValue: '[10,∞)', displayText: 'High' },
            ],
          },
          key: 'mappingValue',
          fields: ['mappingValue', 'displayText'],
        },
      });
    });

    it('should generate lookup-based transform when using validValues', () => {
      const result = generateTransformLayer(
        true,
        'field',
        undefined,
        mockValidValues,
        'useValueMapping',
        true
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
        'highlightValueMapping',
        true
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

    it('should accept both values and ranges when both exist', () => {
      const result = generateTransformLayer(
        true,
        'field',
        mockValidRanges,
        mockValidValues,
        'highlightValueMapping',
        true
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
                {
                  mappingValue: '[0,10)',
                  displayText: 'Low',
                },
                {
                  mappingValue: '[10,∞)',
                  displayText: 'High',
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

      expect(result).toBe(
        "{'[0,10)': 'Low Range', '[10,∞)': 'High Range'}[datum.label] || datum.label"
      );
    });

    it('should generate label expression for values with display text', () => {
      const result = generateLabelExpr(undefined, mockValidValues, 'useValueMapping');

      expect(result).toBe("{'A': 'Apple Display', 'B': 'B'}[datum.label] || datum.label");
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

      expect(result).toBe("{'A': 'A', 'B': 'B'}[datum.label] || datum.label");
    });

    it('should add unmatched entry for filterButKeepOpposite', () => {
      const result = generateLabelExpr(undefined, mockValidValues, 'highlightValueMapping');

      expect(result).toBe(
        "{'A': 'Apple Display', 'B': 'B', null: 'unmatched'}[datum.label] || datum.label"
      );
    });

    it('should prefer values over ranges when both exist', () => {
      const result = generateLabelExpr(mockValidRanges, mockValidValues, 'useValueMapping');

      expect(result).toBe(
        "{'A': 'Apple Display', 'B': 'B', '[0,10)': 'Low Range', '[10,∞)': 'High Range'}[datum.label] || datum.label"
      );
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

      expect(result).toBe("{'[5,∞)': 'Above 5'}[datum.label] || datum.label");
    });
  });
});

describe('processData', () => {
  const mockData = [
    { category: 'A', value: 10 },
    { category: 'A', value: 20 },
    { category: 'B', value: 30 },
    { category: 'B', value: 40 },
  ];

  const mockValueMappings: ValueMapping[] = [
    { type: 'value', value: '15', displayText: 'Fifteen', color: '#ff0000' },
    { type: 'value', value: '30', displayText: 'Thirty', color: '#00ff00' },
  ];

  const mockRangeMappings: ValueMapping[] = [
    { type: 'range', range: { min: 0, max: 25 }, displayText: 'Low', color: '#0000ff' },
    { type: 'range', range: { min: 25, max: 50 }, displayText: 'High', color: '#ffff00' },
  ];

  it('should process data without calculation method', () => {
    const result = processData({
      transformedData: mockData,
      categoricalColumn: 'category',
      numericalColumn: 'value',
      transformedCalculationMethod: undefined,
      valueMappings: mockValueMappings,
      rangeMappings: mockRangeMappings,
    });

    expect(result.newRecord).toHaveLength(4);
    expect(result.newRecord[0]).toHaveProperty('mergedLabel');
    expect(result.validValues).toHaveLength(1);
    expect(result.validRanges).toHaveLength(2);
  });

  it('should process data with total calculation method', () => {
    const result = processData({
      transformedData: mockData,
      categoricalColumn: 'category',
      numericalColumn: 'value',
      transformedCalculationMethod: 'total' as CalculationMethod,
      valueMappings: mockValueMappings,
      rangeMappings: mockRangeMappings,
    });

    expect(result.newRecord).toHaveLength(2);
    expect(result.newRecord[0].value).toBe(30);
    expect(result.newRecord[1].value).toBe(70);
  });

  it('should handle value mappings correctly', () => {
    const testData = [{ category: 'A', value: 30 }];

    const result = processData({
      transformedData: testData,
      categoricalColumn: 'category',
      numericalColumn: 'value',
      transformedCalculationMethod: undefined,
      valueMappings: mockValueMappings,
      rangeMappings: undefined,
    });

    expect(result.newRecord[0].mergedLabel).toBe('30');
    expect(result.validValues).toMatchObject([
      {
        type: 'value',
        value: '30',
        displayText: 'Thirty',
        color: '#00ff00',
      },
    ]);
  });

  it('should handle range mappings correctly', () => {
    const testData = [{ category: 'A', value: 15 }];

    const result = processData({
      transformedData: testData,
      categoricalColumn: 'category',
      numericalColumn: 'value',
      transformedCalculationMethod: undefined,
      valueMappings: undefined,
      rangeMappings: mockRangeMappings,
    });

    expect(result.newRecord[0].mergedLabel).toBe('[0,25)');
    expect(result.validRanges).toMatchObject([
      { type: 'range', range: { min: 0, max: 25 }, displayText: 'Low', color: '#0000ff' },
    ]);
  });

  it('should handle null values', () => {
    const testData = [{ category: 'A', value: null }];

    const result = processData({
      transformedData: testData,
      categoricalColumn: 'category',
      numericalColumn: 'value',
      transformedCalculationMethod: undefined,
      valueMappings: mockValueMappings,
      rangeMappings: mockRangeMappings,
    });

    expect(result.newRecord[0].mergedLabel).toBeNull();
  });

  it('should handle categoricalColumn2', () => {
    const testData = [
      { cat1: 'A', cat2: 'X', value: 10 },
      { cat1: 'A', cat2: 'X', value: 30 },
      { cat1: 'A', cat2: 'Y', value: 20 },
    ];

    const result = processData({
      transformedData: testData,
      categoricalColumn: 'cat1',
      numericalColumn: 'value',
      transformedCalculationMethod: 'total' as CalculationMethod,
      valueMappings: [
        {
          type: 'value',
          value: '40',
          displayText: 'Thirty',
          color: '#00ff00',
        },
      ],
      rangeMappings: undefined,
      categoricalColumn2: 'cat2',
    });

    expect(result.newRecord).toMatchObject([
      { cat1: 'A', cat2: 'X', value: 40, mergedLabel: '40' },
      { cat1: 'A', cat2: 'Y', value: 20, mergedLabel: null },
    ]);
    expect(result.newRecord[0].mergedLabel).toBe('40');
    expect(result.categorical2Options).toEqual(['X', 'Y']);
  });
});
