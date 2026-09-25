/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SankeySeriesOption } from 'echarts';
import { AxisRole, VisColumn } from '../types';
import { getColors } from '../theme/default_colors';
import { createBaseConfig, EChartsSpecState, PipelineFn, pipe } from '../utils/echarts_spec';
import { transform, TransformFn } from '../utils/data_transformation';
import { formatUnitValue } from '../style_panel/unit/collection';
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
    const links: Array<{ source: string; target: string; value: number }> = [];
    const linksBySource = new Map<
      string,
      Map<string, { source: string; target: string; value: number }>
    >();

    data.forEach((row) => {
      const sourceValue = row[sourceField];
      const targetValue = row[targetField];
      const source = sourceValue == null ? '' : String(sourceValue);
      const target = targetValue == null ? '' : String(targetValue);
      const value = Number(row[valueField]);

      if (!source || !target || !Number.isFinite(value) || value <= 0) {
        return;
      }

      let linksByTarget = linksBySource.get(source);
      if (!linksByTarget) {
        linksByTarget = new Map();
        linksBySource.set(source, linksByTarget);
      }

      const existingLink = linksByTarget.get(target);
      if (existingLink) {
        // A Sankey link represents the total flow between two nodes, even when
        // the query returns that flow across multiple rows.
        existingLink.value += value;
      } else {
        const link = { source, target, value };
        linksByTarget.set(target, link);
        links.push(link);
      }
    });

    // Individually valid values can still overflow when duplicate rows are summed.
    return links.filter(({ value }) => Number.isFinite(value));
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
    const gradientLabelColors =
      exclusive.showLinkLabels && exclusive.linkColor === 'gradient' ? getColors() : undefined;
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
      nodeWidth: exclusive.nodeWidth,
      label: {
        show: exclusive.showNodeLabels,
      },
      edgeLabel: {
        show: exclusive.showLinkLabels,
        // ECharts calculates label contrast for solid source/target colors, but
        // gradients fall back to one light color. Add a theme-aware outline so
        // the value remains readable across both ends of the gradient.
        ...(gradientLabelColors && {
          color: gradientLabelColors.text,
          textBorderColor: gradientLabelColors.backgroundShade,
          textBorderWidth: 2,
        }),
        ...(exclusive.showLinkLabels && {
          formatter: ({ value }: { value?: unknown }) =>
            formatUnitValue(Number(value), styles.unitId, styles.decimals, styles.unitSuffix),
        }),
      },
      lineStyle: {
        color: exclusive.linkColor,
        opacity: exclusive.linkOpacity,
      },
      emphasis: {
        focus: 'trajectory',
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
