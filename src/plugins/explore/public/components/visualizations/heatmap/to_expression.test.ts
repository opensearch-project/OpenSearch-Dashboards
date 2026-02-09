/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHeatmapWithBin, createRegularHeatmap } from './to_expression';
import { VisFieldType, VisColumn, TooltipOptions, Positions } from '../types';
import { HeatmapChartStyle } from './heatmap_vis_config';

jest.mock('./heatmap_chart_utils', () => ({
  enhanceStyle: jest.fn(),
  addTransform: jest.fn(() => []),
  createLabelLayer: jest.fn(() => null),
}));

jest.mock('../utils/utils', () => ({
  applyAxisStyling: jest.fn(() => ({ title: 'mockAxis' })),
  getSwappedAxisRole: jest.fn((styles, mappings) => ({ xAxis: mappings.x, yAxis: mappings.y })),
  getSchemaByAxis: jest.fn((axis) => (axis?.schema === 'Numerical' ? 'quantitative' : 'nominal')),
  getChartRender: jest.fn(),
}));

const mockNumericColumns: VisColumn[] = [
  {
    id: 1,
    name: 'value1',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
  {
    id: 2,
    name: 'value2',
    schema: VisFieldType.Numerical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
];

const mockCategoricalColumns: VisColumn[] = [
  {
    id: 3,
    name: 'category1',
    schema: VisFieldType.Categorical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
  {
    id: 4,
    name: 'category2',
    schema: VisFieldType.Categorical,
    column: 'field-3',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  },
];

const mockData: any[] = [];

const mockAxisMappings = {
  x: mockNumericColumns[0],
  y: mockCategoricalColumns[1],
  color: mockNumericColumns[1],
};

const baseStyles = {
  tooltipOptions: {
    mode: 'all',
  } as TooltipOptions,
  exclusive: {
    maxNumberOfColors: 7,
    colorSchema: 'blues',
    colorScaleType: 'linear',
    reverseSchema: false,
  },
  addLegend: true,
  legendPosition: Positions.RIGHT,
  legendTitle: 'value1',
} as HeatmapChartStyle;

describe('createHeatmapWithBin', () => {
  it('should create a heatmap with binned axes', () => {
    const spec = createHeatmapWithBin(mockData, mockNumericColumns, baseStyles, mockAxisMappings);

    const layer = spec.layer[0];
    expect(layer.mark.type).toBe('rect');
    expect(layer.encoding.x.bin).toBe(true);
    expect(layer.encoding.y.bin).toBe(true);
    expect(layer.encoding.color.bin).toEqual({ maxbins: 7 });
    expect(layer.encoding.color.scale).toEqual({
      type: 'linear',
      scheme: 'blues',
      reverse: false,
    });
    expect(layer.encoding.color.legend.title).toBe('value1');
    expect(layer.encoding.color.legend.orient).toBe('right');
  });

  it('should handle different title display options', () => {
    // Case 1: No title (show = false)
    const noTitleStyles = {
      ...baseStyles,
      titleOptions: {
        show: false,
        titleName: '',
      },
    };

    const noTitleResult = createHeatmapWithBin(
      mockData,
      mockNumericColumns,
      noTitleStyles,
      mockAxisMappings
    );
    expect(noTitleResult.title).toBeUndefined();

    // Case 2: Default title (show = true, titleName = '')
    const defaultTitleStyles = {
      ...baseStyles,
      titleOptions: {
        show: true,
        titleName: '',
      },
    };

    const defaultTitleResult = createHeatmapWithBin(
      mockData,
      mockNumericColumns,
      defaultTitleStyles,
      mockAxisMappings
    );
    expect(defaultTitleResult.title).toBe('value2 by value1 and category2');

    // Case 3: Custom title (show = true, titleName = 'Custom Title')
    const customTitleStyles = {
      ...baseStyles,
      titleOptions: {
        show: true,
        titleName: 'Custom Binned Heatmap',
      },
    };

    const customTitleResult = createHeatmapWithBin(
      mockData,
      mockNumericColumns,
      customTitleStyles,
      mockAxisMappings
    );
    expect(customTitleResult.title).toBe('Custom Binned Heatmap');
  });

  it('should disable binning when useThresholdColor is true', () => {
    const styles = {
      ...baseStyles,
      exclusive: {
        ...baseStyles.exclusive,
      },
      useThresholdColor: true,
      thresholdOptions: {},
    };

    const spec = createHeatmapWithBin(mockData, mockNumericColumns, styles, mockAxisMappings);
    expect(spec.layer[0].encoding.color.bin).toBe(false);
  });

  it('should hide legend when addLegend is false', () => {
    const styles = {
      ...baseStyles,
      addLegend: false,
    };

    const spec = createHeatmapWithBin(mockData, mockNumericColumns, styles, mockAxisMappings);
    expect(spec.layer[0].encoding.color.legend).toBeNull();
  });
});

describe('createRegularHeatmap', () => {
  const regularAxisMappings = {
    x: mockCategoricalColumns[0],
    y: mockCategoricalColumns[1],
    color: mockNumericColumns[0],
  };

  it('should create a regular heatmap with categorical axes', () => {
    const spec = createRegularHeatmap(
      mockData,
      mockNumericColumns,
      baseStyles,
      regularAxisMappings
    );

    // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
    const encoding = spec.layer[0].encoding;
    expect(encoding.x.type).toBe('nominal');
    expect(encoding.y.type).toBe('nominal');
    expect(encoding.color.field).toBe('field-1'); // <-- FIXED
  });

  it('should handle different title display options', () => {
    // Case 1: No title (show = false)
    const noTitleStyles = {
      ...baseStyles,
      titleOptions: {
        show: false,
        titleName: '',
      },
    };

    const noTitleResult = createRegularHeatmap(
      mockData,
      mockNumericColumns,
      noTitleStyles,
      regularAxisMappings
    );
    // @ts-expect-error TS18048 TODO(ts-error): fixme
    expect(noTitleResult.title).toBeUndefined();

    // Case 2: Default title (show = true, titleName = '')
    const defaultTitleStyles = {
      ...baseStyles,
      titleOptions: {
        show: true,
        titleName: '',
      },
    };

    const defaultTitleResult = createRegularHeatmap(
      mockData,
      mockNumericColumns,
      defaultTitleStyles,
      regularAxisMappings
    );
    // @ts-expect-error TS18048 TODO(ts-error): fixme
    expect(defaultTitleResult.title).toBe('value1 by category1 and category2');

    // Case 3: Custom title (show = true, titleName = 'Custom Title')
    const customTitleStyles = {
      ...baseStyles,
      titleOptions: {
        show: true,
        titleName: 'Custom Regular Heatmap',
      },
    };

    const customTitleResult = createRegularHeatmap(
      mockData,
      mockNumericColumns,
      customTitleStyles,
      regularAxisMappings
    );
    // @ts-expect-error TS18048 TODO(ts-error): fixme
    expect(customTitleResult.title).toBe('Custom Regular Heatmap');
  });

  it('should respect color scale settings', () => {
    const styles = {
      ...baseStyles,
      exclusive: {
        ...baseStyles.exclusive,
        colorScaleType: 'log',
        colorSchema: 'reds',
        reverseSchema: true,
      },
    } as HeatmapChartStyle;

    const spec = createRegularHeatmap(mockData, mockNumericColumns, styles, regularAxisMappings);
    // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
    expect(spec.layer[0].encoding.color.scale).toEqual({
      type: 'log',
      scheme: 'reds',
      reverse: true,
    });
  });

  it('should disable binning for color when useThresholdColor is true', () => {
    const styles = {
      ...baseStyles,
      exclusive: {
        ...baseStyles.exclusive,
      },
      useThresholdColor: true,
      thresholdOptions: {},
    };

    const spec = createRegularHeatmap(mockData, mockNumericColumns, styles, regularAxisMappings);
    // @ts-expect-error TS18048, TS18046 TODO(ts-error): fixme
    expect(spec.layer[0].encoding.color.bin).toBe(false);
  });
});
