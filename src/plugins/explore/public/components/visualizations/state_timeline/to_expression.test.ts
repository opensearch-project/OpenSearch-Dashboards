/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createNumericalStateTimeline,
  createCategoricalStateTimeline,
  createSingleCategoricalStateTimeline,
  createSingleNumericalStateTimeline,
} from './to_expression';
import {
  DisableMode,
  AxisRole,
  VEGASCHEMA,
  VisFieldType,
  VisColumn,
  AxisColumnMappings,
} from '../types';
import { defaultStateTimeLineChartStyles, StateTimeLineChartStyle } from './state_timeline_config';

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
  mergeNumericalDataCore: jest.fn(() => [
    [
      {
        timestamp: '2023-01-01',
        category: 'A',
        mergedLabel: '[200,400)',
        start: '2023-01-01',
        end: '2023-01-02',
        duration: '1h 30m',
        mergedCount: 3,
      },
    ],
    [{ range: { min: 0, max: 1000 }, color: '#ff0000' }],
    [{ value: 'A', color: '#ff0000' }],
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
  convertThresholdsToValueMappings: jest.fn(() => [
    { range: { min: 0, max: 100 }, color: '#green' },
    { range: { min: 100, max: 200 }, color: '#yellow' },
  ]),
}));

jest.mock('../style_panel/value_mapping/value_mapping_utils', () => ({
  generateTransformLayer: jest.fn(() => [
    {
      lookup: 'field1',
      from: {
        data: {
          values: [],
        },
        key: 'mappingValue',
        fields: ['mappingValue', 'displayText'],
      },
    },
  ]),
  decideScale: jest.fn(),
  generateLabelExpr: jest.fn(),
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
  colorModeOption: 'useValueMapping',
} as StateTimeLineChartStyle;

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
        { ...mockStyleOptions, valueMappingOptions: { valueMappings: rangeMappings } },
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          category: 'A',
          mergedLabel: '[200,400)',
          start: '2023-01-01',
          end: '2023-01-02',
          duration: '1h 30m',
          mergedCount: 3,
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

    it('should able to handle value mappings in numerical state timeline', () => {
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
        {
          ...mockStyleOptions,
          valueMappingOptions: { valueMappings: [{ type: 'value', value: 'A' }] },
        },
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          category: 'A',
          mergedLabel: '[200,400)',
          start: '2023-01-01',
          end: '2023-01-02',
          duration: '1h 30m',
          mergedCount: 3,
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

      const result2 = createNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        { ...mockStyleOptions, colorModeOption: 'none' },
        mockAxisColumnMappings
      );
      // Verify the mark layer
      const markLayer2 = result2.layer[0];
      expect(markLayer2).toHaveProperty('mark.type', 'rect');
      expect(markLayer2).toHaveProperty('mark.tooltip', true);

      // Verify encoding
      expect(markLayer2).toHaveProperty('encoding.x.field', 'timestamp');
      expect(markLayer2).toHaveProperty('encoding.x.type', 'temporal');
      expect(markLayer2).toHaveProperty('encoding.x.type', 'temporal');
      expect(markLayer2).toHaveProperty('encoding.x2.field', 'end');

      expect(markLayer2).toHaveProperty('encoding.y.field', 'category');
      expect(markLayer2).toHaveProperty('encoding.y.type', 'nominal');
      expect(markLayer2).toHaveProperty('encoding.color.field', 'v1');
    });

    it('includes text layer when showValues is true', () => {
      const styleWithText = {
        ...mockStyleOptions,
        exclusive: { ...mockStyleOptions.exclusive, showValues: true },
      };

      const result = createNumericalStateTimeline(mockData, [], [], [], styleWithText);
      expect(result.layer).toHaveLength(2);
    });
    it('should display Ranges when customized legend title is not set', () => {
      const rangeMappings = [{ type: 'range', range: { min: 0 } }];
      const styleWithLegend = {
        ...mockStyleOptions,
        valueMappingOptions: { valueMappings: rangeMappings },
      };
      const result = createNumericalStateTimeline(mockData, [], [], [], styleWithLegend);
      expect(result.layer[0].encoding.color.legend.title).toBe('Ranges');
    });

    it('should display customized legend title', () => {
      const styleWithLegend = {
        ...mockStyleOptions,
        legendTitle: 'default',
      };
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
    it('should display customized legend title', () => {
      const styleWithLegend = {
        ...mockStyleOptions,
        legendTitle: 'default',
      };
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
    it('should display customized legend title', () => {
      const styleWithLegend = {
        ...mockStyleOptions,
        legendTitle: 'default',
      };
      const result = createSingleCategoricalStateTimeline(mockData, [], [], [], styleWithLegend);
      expect(result.layer[0].encoding.color.legend.title).toBe('default');
    });
  });

  describe('createSingleNumericalStateTimeline', () => {
    const mockAxisColumnMappings: AxisColumnMappings = {
      [AxisRole.COLOR]: mockNumericalColumns[0],
      [AxisRole.X]: mockTimeColumns[0],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a single numerical state timeline with correct structure', () => {
      const rangeMappings = [{ type: 'range', range: { min: 0, max: 100 }, color: '#ff0000' }];

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        { ...mockStyleOptions, valueMappingOptions: { valueMappings: rangeMappings } },
        mockAxisColumnMappings
      );

      // Verify the basic structure
      expect(result).toHaveProperty('$schema', VEGASCHEMA);
      expect(result).toHaveProperty('data.values', [
        {
          timestamp: '2023-01-01',
          category: 'A',
          mergedLabel: '[200,400)',
          start: '2023-01-01',
          end: '2023-01-02',
          duration: '1h 30m',
          mergedCount: 3,
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

      // Verify fake Y axis is added in transform
      expect(result.transform).toContainEqual({
        calculate: "'Response'",
        as: 'fakeYAxis',
      });
    });

    it('should handle none color mode', () => {
      const styleWithoutColorMode = {
        ...mockStyleOptions,
        colorModeOption: 'none',
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithoutColorMode,
        mockAxisColumnMappings
      );

      expect(result.layer[0].encoding.color.field).toBe('v1');
    });

    it('should include text layer when showValues is true and value mapping exists', () => {
      const styleWithText = {
        ...mockStyleOptions,
        exclusive: { ...mockStyleOptions.exclusive, showValues: true },
        valueMappingOptions: { valueMappings: [{ type: 'range', range: { min: 0 } }] },
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithText,
        mockAxisColumnMappings
      );

      expect(result.layer).toHaveLength(2);

      const textLayer = result.layer[1];
      expect(textLayer.mark.type).toBe('text');
      expect(textLayer.encoding.text.field).toBe('displayText');
    });

    it('should not include text layer when showValues is false', () => {
      const styleWithoutText = {
        ...mockStyleOptions,
        exclusive: { ...mockStyleOptions.exclusive, showValues: false },
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithoutText,
        mockAxisColumnMappings
      );

      expect(result.layer).toHaveLength(1);
    });

    it('should display custom legend title when provided', () => {
      const styleWithLegend = {
        ...mockStyleOptions,
        legendTitle: 'Custom Legend',
        addLegend: true,
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithLegend,
        mockAxisColumnMappings
      );

      expect(result.layer[0].encoding.color.legend.title).toBe('Custom Legend');
    });

    it('should hide legend when addLegend is false', () => {
      const styleWithoutLegend = {
        ...mockStyleOptions,
        addLegend: false,
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithoutLegend,
        mockAxisColumnMappings
      );

      expect(result.layer[0].encoding.color.legend).toBe(null);
    });

    it('should set legend position correctly', () => {
      const styleWithLegendPosition = {
        ...mockStyleOptions,
        addLegend: true,
        legendPosition: 'RIGHT',
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithLegendPosition,
        mockAxisColumnMappings
      );

      expect(result.layer[0].encoding.color.legend.orient).toBe('right');
    });

    it('should include tooltip when tooltipOptions mode is not hidden', () => {
      const styleWithTooltip = {
        ...mockStyleOptions,
        tooltipOptions: { mode: 'show' },
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithTooltip,
        mockAxisColumnMappings
      );

      expect(result.layer[0].mark.tooltip).toBe(true);
      expect(result.layer[0].encoding.tooltip).toBeDefined();
      expect(Array.isArray(result.layer[0].encoding.tooltip)).toBe(true);
    });

    it('should hide tooltip when tooltipOptions mode is hidden', () => {
      const styleWithoutTooltip = {
        ...mockStyleOptions,
        tooltipOptions: { mode: 'hidden' },
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithoutTooltip,
        mockAxisColumnMappings
      );

      expect(result.layer[0].mark.tooltip).toBe(false);
      expect(result.layer[0].encoding.tooltip).toBeUndefined();
    });

    it('should include title when titleOptions show is true', () => {
      const styleWithTitle = {
        ...mockStyleOptions,
        titleOptions: { show: true, titleName: 'Custom Timeline Title' },
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithTitle,
        mockAxisColumnMappings
      );

      expect(result.title).toBe('Custom Timeline Title');
    });

    it('should handle row height styling', () => {
      const styleWithRowHeight = {
        ...mockStyleOptions,
        exclusive: {
          ...mockStyleOptions.exclusive,
          rowHeight: 0.3,
        },
      };

      const result = createSingleNumericalStateTimeline(
        mockData,
        mockNumericalColumns,
        mockCateColumns,
        mockTimeColumns,
        styleWithRowHeight,
        mockAxisColumnMappings
      );

      expect(result.layer[0].encoding.y.scale.padding).toBe(0.7);
    });
  });
});
