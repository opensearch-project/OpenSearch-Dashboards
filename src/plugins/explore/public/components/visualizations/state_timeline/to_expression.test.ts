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
  getChartRender: jest.fn(),
}));

jest.mock('./state_timeline_utils', () => ({
  mergeDataCore: jest.fn(() => () => [
    {
      timestamp: '2023-01-01',
      category: 'A',
      mergedLabel: 'mergedLabel',
      start: '2023-01-01',
      end: '2023-01-02',
    },
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

const mockStyleOptions = {
  ...defaultStateTimeLineChartStyles,
  valueMappingOptions: { valueMappings: [{ type: 'value', value: 'red' }] },
};

describe('to_expression', () => {
  describe('createNumericalStateTimeline', () => {
    it('should create a state timeline chart with one date one cate and one metric', () => {
      const rangeMappings = [{ type: 'range', range: { min: 0 } }];
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
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        { ...mockStyleOptions, valueMappingOptions: { valueMappings: rangeMappings } },
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          mergedLabel: 'mergedLabel',
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

    it('should fallback to categorical state timeline when no range mappings are provided', () => {
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
        { ...mockStyleOptions, valueMappingOptions: {} },
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          mergedLabel: 'mergedLabel',
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
      expect(markLayer).toHaveProperty('encoding.color.field', 'v1');
    });

    it('includes text layer when showValues is true', () => {
      const styleWithText = {
        ...mockStyleOptions,
        exclusive: { ...mockStyleOptions.exclusive, showValues: true },
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = createNumericalStateTimeline(mockData, [], [], [], styleWithText);
      expect(result.layer).toHaveLength(2);
    });
    it('should display Ranges when customized legend title is not set', () => {
      const rangeMappings = [{ type: 'range', range: { min: 0 } }];
      const styleWithLegend = {
        ...mockStyleOptions,
        valueMappingOptions: { valueMappings: rangeMappings },
      };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = createNumericalStateTimeline(mockData, [], [], [], styleWithLegend);
      expect(result.layer[0].encoding.color.legend.title).toBe('Ranges');
    });

    it('should display customized legend title', () => {
      const styleWithLegend = {
        ...mockStyleOptions,
        legendTitle: 'default',
      };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = createNumericalStateTimeline(mockData, [], [], [], styleWithLegend);
      expect(result.layer[0].encoding.color.legend.title).toBe('default');
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
        // @ts-expect-error TS2345 TODO(ts-error): fixme
        mockStyleOptions,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          mergedLabel: 'mergedLabel',
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
      expect(markLayer).toHaveProperty('encoding.color.field', 'mappingValue');
    });

    it('includes title when titleOptions show is true', () => {
      const styleWithTitle = {
        ...mockStyleOptions,
        titleOptions: { show: true, titleName: 'Test Title' },
      };

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = createCategoricalStateTimeline(mockData, [], [], [], styleWithTitle);
      expect(result.title).toBe('Test Title');
    });
    it('should display customized legend title', () => {
      const styleWithLegend = {
        ...mockStyleOptions,
        legendTitle: 'default',
      };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = createCategoricalStateTimeline(mockData, [], [], [], styleWithLegend);
      expect(result.layer[0].encoding.color.legend.title).toBe('default');
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
        // @ts-expect-error TS2345 TODO(ts-error): fixme
        mockStyleOptions,
        mockAxisColumnMappings
      );

      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          mergedLabel: 'mergedLabel',
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

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = createSingleCategoricalStateTimeline(mockData, [], [], [], styleWithThreshold);
      expect(result).toHaveProperty('data.values');
    });
    it('should display customized legend title', () => {
      const styleWithLegend = {
        ...mockStyleOptions,
        legendTitle: 'default',
      };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = createSingleCategoricalStateTimeline(mockData, [], [], [], styleWithLegend);
      expect(result.layer[0].encoding.color.legend.title).toBe('default');
    });
  });
});
