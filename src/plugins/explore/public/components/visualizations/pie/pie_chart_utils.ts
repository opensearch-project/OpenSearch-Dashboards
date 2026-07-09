/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieSeriesOption } from 'echarts';
import { PieChartStyle } from './pie_vis_config';
import { BaseChartStyle, PipelineFn, EChartsSpecState } from '../utils/echarts_spec';
import { getColors } from '../theme/default_colors';

export const createPieSeries = <T extends BaseChartStyle>({
  styles,
  cateField,
  valueField,
}: {
  styles: PieChartStyle;
  cateField: string;
  valueField: string;
}): PipelineFn<T> => (state: EChartsSpecState<T>) => {
  const radius = styles?.exclusive.donut ? ['50%', '70%'] : '70%';
  const palette = getColors().categories;
  const data: PieSeriesOption['data'] = [];
  if (state.transformedData) {
    const sortedNames = state.transformedData.map((d) => String(d[cateField])).sort();
    state.transformedData.forEach((d) => {
      const value = d[valueField];
      const name = d[cateField];
      const colorIndex = sortedNames.indexOf(String(name));
      data.push({
        name,
        value,
        itemStyle: {
          color: palette[colorIndex % palette.length],
        },
      });
    });
  }

  let formatter = '{b}';
  if (styles?.exclusive?.showValues && styles?.exclusive?.showLabels) {
    formatter = `{b}: {@${valueField}}`;
  } else if (styles?.exclusive?.showLabels) {
    formatter = '{b}';
  } else if (styles?.exclusive?.showValues) {
    formatter = `{@${valueField}}`;
  }

  const series: PieSeriesOption[] = [
    {
      type: 'pie',
      radius,
      avoidLabelOverlap: true,
      data,
      labelLine: {
        show: true,
      },
      label: {
        show: styles?.exclusive?.showValues || styles?.exclusive?.showLabels,
        formatter,
      },
      labelLayout: {
        width: styles?.exclusive.truncate,
      },
    },
  ];

  return { ...state, series };
};
