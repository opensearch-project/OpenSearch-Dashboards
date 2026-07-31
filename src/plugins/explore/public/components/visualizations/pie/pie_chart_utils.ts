/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieSeriesOption } from 'echarts';
import { PieChartStyle } from './pie_vis_config';
import { BaseChartStyle, PipelineFn, EChartsSpecState } from '../utils/echarts_spec';
import { getColors } from '../theme/default_colors';
import { createDataLegendItem, getLegendColor, LegendItem } from '../utils/legend';
import { normalizeEmptyValue } from '../utils/data_transformation';

export const createPieSeries =
  <T extends BaseChartStyle>({
    styles,
    cateField,
    valueField,
    colorDomainData,
  }: {
    styles: PieChartStyle;
    cateField: string;
    valueField: string;
    colorDomainData?: Array<Record<string, any>>;
  }): PipelineFn<T> =>
  (state: EChartsSpecState<T>) => {
    const radius = styles?.exclusive.donut ? ['50%', '70%'] : '70%';
    const palette = getColors().categories;
    const data: PieSeriesOption['data'] = [];
    const legendItems: LegendItem[] = [];
    if (state.transformedData) {
      const domainData = colorDomainData ?? state.transformedData;
      const sortedNames = Array.from(
        new Set(domainData.map((d) => normalizeEmptyValue(d[cateField])))
      ).sort();
      state.transformedData.forEach((d) => {
        const value = d[valueField];
        const name = normalizeEmptyValue(d[cateField]);
        const color = getLegendColor(name, palette, sortedNames);
        legendItems.push(createDataLegendItem(name, color, 0));
        data.push({
          name,
          value,
          itemStyle: {
            color,
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

    return { ...state, series, legendItems };
  };
