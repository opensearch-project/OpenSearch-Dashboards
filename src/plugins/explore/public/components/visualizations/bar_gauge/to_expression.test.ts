/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBarGaugeSpec } from './to_expression';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { VisColumn, VisFieldType, AxisRole, AxisColumnMappings } from '../types';

jest.mock('../utils/calculation', () => ({
  calculateValue: jest.fn((values, method) => {
    if (method === 'last') return values[values.length - 1];
    if (method === 'max') return Math.max(...values);
    return values[0];
  }),
}));

jest.mock('../theme/default_colors', () => ({
  darkenColor: jest.fn((color) => '#00000'),
  getColors: jest.fn(() => ({ text: 'black', statusGreen: 'green', backgroundShade: 'grey' })),
}));

jest.mock('../utils/utils', () => ({
  getSchemaByAxis: jest.fn((axis) => axis?.schema || 'nominal'),
}));

describe('createBarGaugeSpec', () => {
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
    validValuesCount: 5,
    uniqueValuesCount: 5,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockAxisColumnMappings: AxisColumnMappings = {
    [AxisRole.X]: mockCategoricalColumn,
    [AxisRole.Y]: mockNumericalColumn,
  };

  const mockStyleOptions: BarGaugeChartStyle = {
    tooltipOptions: { mode: 'all' },
    exclusive: {
      orientation: 'vertical',
      displayMode: 'gradient',
      valueDisplay: 'valueColor',
      showUnfilledArea: true,
    },
    thresholdOptions: {
      baseColor: '#green',
      thresholds: [
        { value: 50, color: '#yellow' },
        { value: 80, color: '#red' },
      ],
    },
    valueCalculation: 'last',
    titleOptions: { show: true, titleName: 'Test Chart' },
  };

  const mockTransformedData = [
    { category: 'A', value: 30 },
    { category: 'A', value: 40 },
    { category: 'B', value: 60 },
    { category: 'B', value: 70 },
    { category: 'C', value: 90 },
  ];

  it('should create basic bar gauge spec', () => {
    const spec = createBarGaugeSpec(
      mockTransformedData,
      [mockNumericalColumn],
      [mockCategoricalColumn],
      [],
      mockStyleOptions,
      mockAxisColumnMappings
    );

    expect(spec).toHaveProperty('$schema');
    expect(spec).toHaveProperty('data.values');
    expect(spec).toHaveProperty('layer');
    expect(spec.title).toBe('Test Chart');
  });

  it('should handle horizontal orientation', () => {
    const horizontalStyle = {
      ...mockStyleOptions,
      exclusive: {
        ...mockStyleOptions.exclusive,
        orientation: 'horizontal' as any,
      },
    };

    const spec = createBarGaugeSpec(
      mockTransformedData,
      [mockNumericalColumn],
      [mockCategoricalColumn],
      [],
      horizontalStyle,
      mockAxisColumnMappings
    );

    expect(spec.encoding.x.field).toBe('value');
  });

  it('should handle hidden tooltips', () => {
    const noTooltipStyle = {
      ...mockStyleOptions,
      tooltipOptions: { mode: 'hidden' as any },
    };

    const spec = createBarGaugeSpec(
      mockTransformedData,
      [mockNumericalColumn],
      [mockCategoricalColumn],
      [],
      noTooltipStyle,
      mockAxisColumnMappings
    );

    expect(spec.encoding.tooltip).toBeUndefined();
  });

  it('should show unfilled area', () => {
    const noUnfilledStyle = {
      ...mockStyleOptions,
      exclusive: { ...mockStyleOptions.exclusive, showUnfilledArea: true },
    };

    const spec = createBarGaugeSpec(
      mockTransformedData,
      [mockNumericalColumn],
      [mockCategoricalColumn],
      [],
      noUnfilledStyle,
      mockAxisColumnMappings
    );

    expect(spec.layer[0]).toMatchObject({
      mark: {
        type: 'bar',
        fill: 'grey',
      },
      encoding: {
        y: {
          type: 'quantitative',
          field: 'maxVal',
        },
      },
    });
  });

  it('should handle auto name placement', () => {
    const hiddenNameStyle = {
      ...mockStyleOptions,
      exclusive: { ...mockStyleOptions.exclusive, namePlacement: 'auto' as any },
    };

    const spec = createBarGaugeSpec(
      mockTransformedData,
      [mockNumericalColumn],
      [mockCategoricalColumn],
      [],
      hiddenNameStyle,
      mockAxisColumnMappings
    );

    expect(spec.layer[spec.layer.length - 1].mark.type).toBe('text');
  });

  it('should handle no title', () => {
    const noTitleStyle = {
      ...mockStyleOptions,
      titleOptions: { show: false, titleName: '' },
    };

    const spec = createBarGaugeSpec(
      mockTransformedData,
      [mockNumericalColumn],
      [mockCategoricalColumn],
      [],
      noTitleStyle,
      mockAxisColumnMappings
    );

    expect(spec.title).toBeUndefined();
  });
});
