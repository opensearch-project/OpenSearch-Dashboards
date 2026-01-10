/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieSeriesOption } from 'echarts';
import { PieChartStyle } from './pie_vis_config';
import { BaseChartStyle, PipelineFn, EChartsSpecState } from '../utils/echarts_spec';

export const createPieSeries = <T extends BaseChartStyle>({
  styles,
  cateField,
  valueField,
}: {
  styles: PieChartStyle;
  cateField: string;
  valueField: string;
}): PipelineFn<T> => (state: EChartsSpecState<T>) => {
  const radius = styles?.exclusive.donut ? ['40%', '70%'] : '70%';

  // In dataset + pie mode, params.value is an array like [name, value],
  // so we use params.value[1] to extract only the numeric value for the label.
  const formatter =
    styles?.exclusive?.showValues && styles?.exclusive?.showLabels
      ? (params: any) => params.value
      : styles?.exclusive?.showValues
      ? (params: any) => params.value[1]
      : '{b}';

  const series: PieSeriesOption[] = [
    {
      type: 'pie',
      radius,
      avoidLabelOverlap: true,
      encode: {
        itemName: cateField,
        value: valueField,
      },
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
