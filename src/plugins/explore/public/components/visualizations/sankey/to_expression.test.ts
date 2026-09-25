/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisColumn, VisFieldType } from '../types';
import { getColors } from '../theme/default_colors';
import { defaultSankeyChartStyles } from './sankey_vis_config';
import { createSankeySpec } from './to_expression';

const sourceColumn: VisColumn = {
  id: 1,
  name: 'Source',
  schema: VisFieldType.Categorical,
  column: 'source',
};
const targetColumn: VisColumn = {
  id: 2,
  name: 'Target',
  schema: VisFieldType.Categorical,
  column: 'target',
};
const valueColumn: VisColumn = {
  id: 3,
  name: 'Value',
  schema: VisFieldType.Numerical,
  column: 'value',
};
const axisColumnMappings = {
  [AxisRole.SOURCE]: sourceColumn,
  [AxisRole.TARGET]: targetColumn,
  [AxisRole.Value]: valueColumn,
};

describe('Sankey to_expression', () => {
  it('creates a draggable Sankey series from source, target, and value fields', () => {
    const spec = createSankeySpec(
      [
        { source: 'A', target: 'B', value: 10 },
        { source: 'B', target: 'C', value: 5 },
      ],
      defaultSankeyChartStyles,
      axisColumnMappings
    );

    expect(spec).toMatchObject({
      legend: { show: false },
      series: [
        {
          type: 'sankey',
          draggable: true,
          orient: 'horizontal',
          nodeWidth: 20,
          label: { show: true },
          edgeLabel: { show: false },
          emphasis: { focus: 'trajectory' },
          lineStyle: { color: 'gradient', opacity: 0.4 },
          data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
          links: [
            { source: 'A', target: 'B', value: 10 },
            { source: 'B', target: 'C', value: 5 },
          ],
        },
      ],
    });
    expect(spec?.series?.[0]).not.toHaveProperty('nodeAlign');
    expect(spec?.series?.[0]).not.toHaveProperty('nodeGap');
  });

  it('aggregates duplicate links and applies link and level styles', () => {
    const spec = createSankeySpec(
      [
        { source: 'A', target: 'B', value: 10 },
        { source: 'A', target: 'B', value: 5 },
      ],
      {
        ...defaultSankeyChartStyles,
        exclusive: {
          ...defaultSankeyChartStyles.exclusive,
          linkColor: 'gradient',
          linkOpacity: 0.6,
          levels: [{ depth: 0, color: '#abcdef', opacity: 0.7 }],
        },
      },
      axisColumnMappings
    );

    expect(spec?.series?.[0]).toMatchObject({
      lineStyle: {
        color: 'gradient',
        opacity: 0.6,
      },
      links: [{ source: 'A', target: 'B', value: 15 }],
      levels: [
        {
          depth: 0,
          itemStyle: {
            color: '#abcdef',
            opacity: 0.7,
          },
        },
      ],
    });
  });

  it('excludes a link when its aggregated value overflows', () => {
    const spec = createSankeySpec(
      [
        { source: 'A', target: 'B', value: Number.MAX_VALUE },
        { source: 'A', target: 'B', value: Number.MAX_VALUE },
        { source: 'C', target: 'D', value: 1 },
      ],
      defaultSankeyChartStyles,
      axisColumnMappings
    );

    expect(spec?.series?.[0]).toMatchObject({
      data: [{ name: 'C' }, { name: 'D' }],
      links: [{ source: 'C', target: 'D', value: 1 }],
    });
  });

  it('coerces valid values and excludes links with invalid endpoints or values', () => {
    const spec = createSankeySpec(
      [
        { source: 'A', target: 'B', value: '10' },
        { source: 'B', target: 'C', value: null },
        { source: 'C', target: 'D', value: 0 },
        { source: 'D', target: 'E', value: -1 },
        { source: 'E', target: 'F', value: Number.POSITIVE_INFINITY },
        { source: 'F', target: 'G', value: Number.NaN },
        { source: null, target: 'H', value: 1 },
        { source: 'H', target: undefined, value: 1 },
        { source: '', target: 'I', value: 1 },
      ],
      defaultSankeyChartStyles,
      axisColumnMappings
    );

    expect(spec?.series?.[0]).toMatchObject({
      data: [{ name: 'A' }, { name: 'B' }],
      links: [{ source: 'A', target: 'B', value: 10 }],
    });
  });

  it('formats visible link values using Standard options', () => {
    const spec = createSankeySpec(
      [{ source: 'A', target: 'B', value: 10 }],
      {
        ...defaultSankeyChartStyles,
        decimals: 2,
        unitSuffix: 'ms',
        exclusive: {
          ...defaultSankeyChartStyles.exclusive,
          showLinkLabels: true,
        },
      },
      axisColumnMappings
    );

    const series = spec?.series?.[0] as any;
    expect(series.edgeLabel.formatter({ value: 10 })).toBe('10.00 ms');
    expect(series.edgeLabel).toMatchObject({
      color: getColors().text,
      textBorderColor: getColors().backgroundShade,
      textBorderWidth: 2,
    });
  });

  it.each(['source', 'target'] as const)(
    'keeps ECharts automatic label contrast for %s link colors',
    (linkColor) => {
      const spec = createSankeySpec(
        [{ source: 'A', target: 'B', value: 10 }],
        {
          ...defaultSankeyChartStyles,
          exclusive: {
            ...defaultSankeyChartStyles.exclusive,
            linkColor,
            showLinkLabels: true,
          },
        },
        axisColumnMappings
      );

      const series = spec?.series?.[0] as any;
      expect(series.edgeLabel).not.toHaveProperty('color');
      expect(series.edgeLabel).not.toHaveProperty('textBorderColor');
      expect(series.edgeLabel).not.toHaveProperty('textBorderWidth');
    }
  );

  it('creates an empty series when no links are valid', () => {
    const spec = createSankeySpec(
      [
        { source: 'A', target: 'B', value: 0 },
        { source: null, target: 'C', value: 1 },
      ],
      defaultSankeyChartStyles,
      axisColumnMappings
    );

    expect(spec?.series?.[0]).toMatchObject({
      data: [],
      links: [],
    });
  });
});
