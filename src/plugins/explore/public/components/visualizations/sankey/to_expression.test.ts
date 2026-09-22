/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisColumn, VisFieldType } from '../types';
import { defaultSankeyChartStyles } from './sankey_vis_config';
import { createSankeySpec } from './to_expression';

describe('Sankey to_expression', () => {
  it('creates a draggable Sankey series from source, target, and value fields', () => {
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

    const spec = createSankeySpec(
      [
        { source: 'A', target: 'B', value: 10 },
        { source: 'B', target: 'C', value: 5 },
      ],
      defaultSankeyChartStyles,
      {
        [AxisRole.SOURCE]: sourceColumn,
        [AxisRole.TARGET]: targetColumn,
        [AxisRole.Value]: valueColumn,
      }
    );

    expect(spec).toMatchObject({
      legend: { show: false },
      series: [
        {
          type: 'sankey',
          draggable: true,
          orient: 'horizontal',
          nodeAlign: 'justify',
          nodeWidth: 20,
          nodeGap: 8,
          label: { show: true },
          edgeLabel: { show: false },
          lineStyle: { color: 'gradient', opacity: 0.4 },
          data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
          links: [
            { source: 'A', target: 'B', value: 10 },
            { source: 'B', target: 'C', value: 5 },
          ],
        },
      ],
    });
  });

  it('preserves duplicate links and applies link and level styles', () => {
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
      {
        [AxisRole.SOURCE]: sourceColumn,
        [AxisRole.TARGET]: targetColumn,
        [AxisRole.Value]: valueColumn,
      }
    );

    expect(spec?.series?.[0]).toMatchObject({
      lineStyle: {
        color: 'gradient',
        opacity: 0.6,
      },
      links: [
        { source: 'A', target: 'B', value: 10 },
        { source: 'A', target: 'B', value: 5 },
      ],
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
});
