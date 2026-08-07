/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPieSpec } from './to_expression';
import { VisColumn, VisFieldType, Positions, AxisRole } from '../types';
import { defaultPieChartStyles, PieChartStyle } from './pie_vis_config';
import { getColors } from '../theme/default_colors';

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
  };

  const categoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
  };

  const mockStyles: PieChartStyle = {
    ...defaultPieChartStyles,
    addLegend: true,
    legendPosition: Positions.RIGHT,
  };

  const mockAxisMappings = {
    [AxisRole.SIZE]: numericColumn,
    [AxisRole.COLOR]: categoricalColumn,
  };

  it('returns an ECharts spec with dataset and series', () => {
    const result = createPieSpec(mockData, mockStyles, mockAxisMappings);

    expect(result.spec).toHaveProperty('dataset');
    expect(result.spec).toHaveProperty('series');
    expect(Array.isArray(result.spec?.series)).toBe(true);
  });

  it('produces pie-type series', () => {
    const result = createPieSpec(mockData, mockStyles, mockAxisMappings);

    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    const pieSeries = result.spec?.series?.filter((s: any) => s.type === 'pie');
    expect(pieSeries.length).toBeGreaterThanOrEqual(1);
  });

  it('configures donut radius when donut option is true', () => {
    const donutStyles = {
      ...mockStyles,
      exclusive: { ...mockStyles.exclusive, donut: true },
    };

    const result = createPieSpec(mockData, donutStyles, mockAxisMappings);

    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    const pieSeries = result.spec?.series?.find((s: any) => s.type === 'pie');
    expect(Array.isArray(pieSeries.radius)).toBe(true);
  });

  it('emits data-target legend items for pie slices', () => {
    const result = createPieSpec(mockData, mockStyles, mockAxisMappings);

    expect(result.legendItems).toEqual([
      {
        label: 'A',
        color: expect.any(String),
        target: { type: 'data', name: 'A', seriesIndex: 0 },
      },
      {
        label: 'B',
        color: expect.any(String),
        target: { type: 'data', name: 'B', seriesIndex: 0 },
      },
      {
        label: 'C',
        color: expect.any(String),
        target: { type: 'data', name: 'C', seriesIndex: 0 },
      },
    ]);
  });

  it('uses provided full data when assigning slice colors', () => {
    const palette = getColors().categories;
    const result = createPieSpec(
      [
        { value: 100, category: 'A' },
        { value: 150, category: 'C' },
      ],
      mockStyles,
      mockAxisMappings,
      [
        { value: 100, category: 'A' },
        { value: 200, category: 'B' },
        { value: 150, category: 'C' },
      ]
    );

    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    const pieSeries = result.spec?.series?.find((s: any) => s.type === 'pie');
    expect(pieSeries.data).toEqual([
      expect.objectContaining({ name: 'A', itemStyle: { color: palette[0] } }),
      expect.objectContaining({ name: 'C', itemStyle: { color: palette[2] } }),
    ]);
    expect(result.legendItems.map((item) => item.color)).toEqual([palette[0], palette[2]]);
  });

  it('normalizes empty values from full data when assigning slice colors', () => {
    const palette = getColors().categories;
    const result = createPieSpec(
      [
        { value: 100, category: null },
        { value: 50, category: undefined },
        { value: 25, category: '' },
        { value: 150, category: 'C' },
      ],
      mockStyles,
      mockAxisMappings,
      [
        { value: 100, category: 'A' },
        { value: 200, category: null },
        { value: 50, category: undefined },
        { value: 25, category: '' },
        { value: 150, category: 'C' },
      ]
    );

    // @ts-expect-error TS2339 TODO(ts-upgrade): fixme
    const pieSeries = result.spec?.series?.find((s: any) => s.type === 'pie');
    expect(pieSeries.data).toEqual([
      expect.objectContaining({ name: '(empty)', value: 175, itemStyle: { color: palette[0] } }),
      expect.objectContaining({ name: 'C', itemStyle: { color: palette[2] } }),
    ]);
    expect(result.legendItems).toEqual([
      {
        label: '(empty)',
        color: palette[0],
        target: { type: 'data', name: '(empty)', seriesIndex: 0 },
      },
      {
        label: 'C',
        color: palette[2],
        target: { type: 'data', name: 'C', seriesIndex: 0 },
      },
    ]);
  });

  it('throws when color or theta config is missing', () => {
    expect(() => createPieSpec(mockData, mockStyles, {} as any)).toThrow();
  });
});
