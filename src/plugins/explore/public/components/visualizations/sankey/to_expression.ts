/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SankeySeriesOption } from 'echarts';
import { AxisRole, VisColumn } from '../types';
import { createBaseConfig, EChartsSpecState, PipelineFn, pipe } from '../utils/echarts_spec';
import { transform, TransformFn } from '../utils/data_transformation';
import { SankeyChartStyle } from './sankey_vis_config';

interface SankeyAxisColumnMappings {
  [AxisRole.SOURCE]: VisColumn;
  [AxisRole.TARGET]: VisColumn;
  [AxisRole.Value]: VisColumn;
}

const toSankeyLinks =
  (axisColumnMappings: SankeyAxisColumnMappings): TransformFn =>
  (data) => {
    const sourceField = axisColumnMappings[AxisRole.SOURCE].column;
    const targetField = axisColumnMappings[AxisRole.TARGET].column;
    const valueField = axisColumnMappings[AxisRole.Value].column;

    return data.map((row) => ({
      source: String(row[sourceField]),
      target: String(row[targetField]),
      value: row[valueField],
    }));
  };

const createSankeySeries =
  (styles: SankeyChartStyle): PipelineFn<SankeyChartStyle> =>
  (state) => {
    const links = (state.transformedData ?? []) as NonNullable<SankeySeriesOption['links']>;
    const nodeNames = new Set<string>();

    links.forEach(({ source, target }) => {
      nodeNames.add(String(source));
      nodeNames.add(String(target));
    });

    const { exclusive } = styles;
    const levels = exclusive.levels.map(({ depth, color, opacity }) => ({
      depth,
      itemStyle: {
        ...(color ? { color } : {}),
        ...(opacity == null ? {} : { opacity }),
      },
    }));

    const series: SankeySeriesOption = {
      type: 'sankey',
      draggable: true,
      orient: exclusive.orient,
      nodeAlign: exclusive.nodeAlign,
      nodeWidth: exclusive.nodeWidth,
      nodeGap: exclusive.nodeGap,
      label: {
        show: exclusive.showNodeLabels,
      },
      edgeLabel: {
        show: exclusive.showLinkLabels,
      },
      lineStyle: {
        color: exclusive.linkColor,
        opacity: exclusive.linkOpacity,
      },
      data: Array.from(nodeNames, (name) => ({ name })),
      links,
      levels,
    };

    return { ...state, series: [series] };
  };

const assembleSankeySpec = (
  state: EChartsSpecState<SankeyChartStyle>
): EChartsSpecState<SankeyChartStyle> => ({
  ...state,
  spec: {
    ...state.baseConfig,
    series: state.series,
  },
});

export const createSankeySpec = (
  transformedData: Array<Record<string, any>>,
  styles: SankeyChartStyle,
  axisColumnMappings: SankeyAxisColumnMappings
) => {
  const result = pipe(
    transform(toSankeyLinks(axisColumnMappings)),
    createBaseConfig({ addTrigger: false, legend: { show: false } }),
    createSankeySeries(styles),
    assembleSankeySpec
  )({
    data: transformedData,
    styles,
    axisColumnMappings,
  });

  return result.spec;
};
