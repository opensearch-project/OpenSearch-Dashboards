/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPieSpec } from './to_expression';
import { VisColumn, VisFieldType, Positions, AxisRole, AxisColumnMappings } from '../types';
import { defaultPieChartStyles, PieChartStyle } from './pie_vis_config';

describe('Pie Chart to_expression', () => {
  const mockData = [
    { value: 100, category: 'A' },
    { value: 200, category: 'B' },
    { value: 150, category: 'C' },
  ];

  const numericColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const categoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockStyles: PieChartStyle = {
    ...defaultPieChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
  };

  const mockAxisMappings: AxisColumnMappings = {
    [AxisRole.SIZE]: numericColumn,
    [AxisRole.COLOR]: categoricalColumn,
  };

  it('returns an ECharts spec with dataset and series', () => {
    const result = createPieSpec(mockData, mockStyles, mockAxisMappings);

    expect(result).toHaveProperty('dataset');
    expect(result).toHaveProperty('series');
    expect(Array.isArray(result?.series)).toBe(true);
  });

  it('produces pie-type series', () => {
    const result = createPieSpec(mockData, mockStyles, mockAxisMappings);

    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    const pieSeries = result?.series?.filter((s: any) => s.type === 'pie');
    expect(pieSeries.length).toBeGreaterThanOrEqual(1);
  });

  it('handles title display options', () => {
    const noTitle = createPieSpec(
      mockData,
      { ...mockStyles, titleOptions: { show: false, titleName: '' } },
      mockAxisMappings
    );
    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    expect(noTitle?.title?.text).toBeUndefined();

    const defaultTitle = createPieSpec(
      mockData,
      { ...mockStyles, titleOptions: { show: true, titleName: '' } },
      mockAxisMappings
    );
    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    expect(defaultTitle?.title?.text).toBe('Value by Category');

    const customTitle = createPieSpec(
      mockData,
      { ...mockStyles, titleOptions: { show: true, titleName: 'Custom Pie' } },
      mockAxisMappings
    );
    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    expect(customTitle?.title?.text).toBe('Custom Pie');
  });

  it('configures donut radius when donut option is true', () => {
    const donutStyles = {
      ...mockStyles,
      exclusive: { ...mockStyles.exclusive, donut: true },
    };

    const result = createPieSpec(mockData, donutStyles, mockAxisMappings);

    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    const pieSeries = result?.series?.find((s: any) => s.type === 'pie');
    expect(Array.isArray(pieSeries.radius)).toBe(true);
  });

  it('throws when color or theta config is missing', () => {
    expect(() => createPieSpec(mockData, mockStyles, {})).toThrow(
      'Missing color or theta config for pie chart'
    );
  });
});
