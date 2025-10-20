/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createNumericalStateTimeline,
  createCategoricalStateTimeline,
  createSingleCategoricalStateTimeline,
} from './to_expression';
import {
  DisableMode,
  AxisRole,
  VEGASCHEMA,
  VisFieldType,
  VisColumn,
  AxisColumnMappings,
} from '../types';
import { defaultStateTimeLineChartStyles } from './state_timeline_config';

jest.mock('../utils/utils', () => ({
  getSwappedAxisRole: jest.fn(() => ({
    xAxis: { column: 'timestamp', name: 'Time' },
    xAxisStyle: { title: { text: 'Time' } },
    yAxis: { column: 'category', name: 'Category' },
    yAxisStyle: { title: { text: 'Category' } },
  })),
  applyAxisStyling: jest.fn(),
}));

jest.mock('./state_timeline_utils', () => ({
  mergeNumericalData: jest.fn(() => [
    [
      {
        timestamp: '2023-01-01',
        category: 'A',
        mergedLabel: '[200,400)',
        start: '2023-01-01',
        end: '2023-01-02',
      },
    ],
    [{ range: { min: 0, max: 1000 }, color: '#ff0000' }],
  ]),
  mergeCategoricalData: jest.fn(() => [
    [
      {
        timestamp: '2023-01-01',
        category: 'A',
        category2: 'true',
        start: '2023-01-01',
        end: '2023-01-02',
      },
    ],
    [{ value: 'A', color: '#ff0000' }],
  ]),
  mergeSingleCategoricalData: jest.fn(() => [
    [
      {
        timestamp: '2023-01-01',
        category: 'A',
        start: '2023-01-01',
        end: '2023-01-02',
      },
    ],
    [{ value: 'A', color: '#ff0000' }],
  ]),
  convertThresholdsToValueMappings: jest.fn(),
}));

const mockData = [
  { timestamp: '2023-01-01', c1: 'A', v1: 20 },
  { timestamp: '2023-01-03', c1: 'A', v1: 50 },
  { timestamp: '2023-01-03', c1: 'C', v1: 20 },
];

const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'value 1',
    schema: VisFieldType.Numerical,
    column: 'v1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockCateColumns: VisColumn[] = [
  {
    id: 1,
    name: 'cate 1',
    schema: VisFieldType.Categorical,
    column: 'c1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
  {
    id: 2,
    name: 'cate 2',
    schema: VisFieldType.Categorical,
    column: 'c2',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockTimeColumns: VisColumn[] = [
  {
    id: 1,
    name: 'date 1',
    schema: VisFieldType.Date,
    column: 'd1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockStyleOptions = defaultStateTimeLineChartStyles;

describe('to_expression', () => {
  describe('createNumericalStateTimeline', () => {
    it('should create a state timeline chart with one date one cate and one metric', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.COLOR]: mockNumericalColumns[0],
        [AxisRole.Y]: mockCateColumns[0],
        [AxisRole.X]: mockTimeColumns[0],
      };

      const result = createNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        mockStyleOptions,
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          mergedLabel: '[200,400)',
          start: '2023-01-01',
          end: '2023-01-02',
          category: 'A',
        },
      ]);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the mark layer
      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.type', 'rect');
      expect(markLayer).toHaveProperty('mark.tooltip', true);

      // Verify encoding
      expect(markLayer).toHaveProperty('encoding.x.field', 'timestamp');
      expect(markLayer).toHaveProperty('encoding.x.type', 'temporal');
      expect(markLayer).toHaveProperty('encoding.x.type', 'temporal');
      expect(markLayer).toHaveProperty('encoding.x2.field', 'end');

      expect(markLayer).toHaveProperty('encoding.y.field', 'category');
      expect(markLayer).toHaveProperty('encoding.y.type', 'nominal');
      expect(markLayer).toHaveProperty('encoding.color.field', 'mergedLabel');
    });

    it('includes text layer when showValues is true', () => {
      const styleWithText = {
        ...mockStyleOptions,
        exclusive: { ...mockStyleOptions.exclusive, showValues: true },
      };

      const result = createNumericalStateTimeline(mockData, [], [], [], styleWithText);
      expect(result.layer).toHaveLength(2);
    });
  });

  describe('createCategoricalStateTimeline', () => {
    it('creates vega spec with correct structure', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.COLOR]: mockCateColumns[1],
        [AxisRole.Y]: mockCateColumns[0],
        [AxisRole.X]: mockTimeColumns[0],
      };
      const result = createCategoricalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        mockStyleOptions,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          category: 'A',
          category2: 'true',
          start: '2023-01-01',
          end: '2023-01-02',
        },
      ]);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the mark layer
      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.type', 'rect');
      expect(markLayer).toHaveProperty('mark.tooltip', true);

      // Verify encoding
      expect(markLayer).toHaveProperty('encoding.x.field', 'timestamp');
      expect(markLayer).toHaveProperty('encoding.x.type', 'temporal');
      expect(markLayer).toHaveProperty('encoding.x.type', 'temporal');
      expect(markLayer).toHaveProperty('encoding.x2.field', 'end');

      expect(markLayer).toHaveProperty('encoding.y.field', 'category');
      expect(markLayer).toHaveProperty('encoding.y.type', 'nominal');
      expect(markLayer).toHaveProperty('encoding.color.field', 'mappingValue');
    });

    it('includes title when titleOptions show is true', () => {
      const styleWithTitle = {
        ...mockStyleOptions,
        titleOptions: { show: true, titleName: 'Test Title' },
      };

      const result = createCategoricalStateTimeline(mockData, [], [], [], styleWithTitle);
      expect(result.title).toBe('Test Title');
    });
  });

  describe('createSingleCategoricalStateTimeline', () => {
    it('creates vega spec with correct structure', () => {
      const mockAxisColumnMappings: AxisColumnMappings = {
        [AxisRole.Y]: mockCateColumns[0],
        [AxisRole.X]: mockTimeColumns[0],
      };
      const result = createSingleCategoricalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        mockStyleOptions,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          category: 'A',
          start: '2023-01-01',
          end: '2023-01-02',
        },
      ]);
      expect(result).toHaveProperty('layer');
      expect(Array.isArray(result.layer)).toBe(true);

      // Verify the mark layer
      const markLayer = result.layer[0];
      expect(markLayer).toHaveProperty('mark.type', 'rect');
      expect(markLayer).toHaveProperty('mark.tooltip', true);

      // Verify encoding
      expect(markLayer).toHaveProperty('encoding.x.field', 'timestamp');
      expect(markLayer).toHaveProperty('encoding.x.type', 'temporal');
      expect(markLayer).toHaveProperty('encoding.x2.field', 'end');
      expect(markLayer).toHaveProperty('encoding.y.field', 'fakeYAxis');
      expect(markLayer).toHaveProperty('encoding.color.field', 'mappingValue');
    });

    it('handles disconnect threshold correctly', () => {
      const styleWithThreshold = {
        ...mockStyleOptions,
        exclusive: {
          ...mockStyleOptions.exclusive,
          disconnectValues: { disableMode: DisableMode.Threshold, threshold: '2h' },
        },
      };

      const result = createSingleCategoricalStateTimeline(mockData, [], [], [], styleWithThreshold);
      expect(result).toHaveProperty('data.values');
    });
  });
});
