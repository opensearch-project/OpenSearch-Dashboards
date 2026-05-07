/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBarGaugeSpec } from './to_expression';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { VisColumn, VisFieldType, AxisRole } from '../types';
import { BarGaugeAxisMapping } from './types';

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

  const mockAxisColumnMappings: BarGaugeAxisMapping = {
    [AxisRole.X]: mockCategoricalColumn,
    [AxisRole.Y]: mockNumericalColumn,
  };

  const mockStyleOptions: BarGaugeChartStyle = {
    tooltipOptions: { mode: 'all' },
    exclusive: {
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

  it('creates an ECharts bar gauge spec with dataset and series', () => {
    const spec = createBarGaugeSpec(mockTransformedData, mockStyleOptions, mockAxisColumnMappings);

    expect(spec).toHaveProperty('dataset');
    expect(spec).toHaveProperty('series');
  });
});
