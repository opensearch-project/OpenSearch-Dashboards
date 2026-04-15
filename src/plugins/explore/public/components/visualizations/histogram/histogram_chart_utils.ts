/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomSeriesOption, EChartsOption, format } from 'echarts';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { getSeriesDisplayName } from '../utils/series';
import { generateThresholdLines, getValueColorByThreshold } from '../utils/utils';
import { HistogramChartStyle } from './histogram_vis_config';
import { getColors } from '../theme/default_colors';

interface Options {
  styles: HistogramChartStyle;
  binStartField: string;
  binEndField: string;
  seriesFields: string[] | ((headers?: string[]) => string[]);
}

export const createHistogramSeries = <T extends BaseChartStyle>(
  options: Options
): PipelineFn<T> => (state) => {
  const { styles, binStartField, binEndField } = options;
  let seriesFields = options.seriesFields;

  const { axisColumnMappings, transformedData = [] } = state;
  const newState = { ...state };
  const headers = transformedData[0] ?? [];

  if (!Array.isArray(seriesFields)) {
    seriesFields = seriesFields(transformedData[0]);
  }

  // no header or no data, return state directly so that chart can still render gracefully
  if (headers.length === 0 || !transformedData[1]) {
    return state;
  }

  const binStartIndex = headers.indexOf(binStartField);
  const binEndIndex = headers.indexOf(binEndField);
  const firstRow = transformedData[1];
  const lastRow = transformedData[transformedData.length - 1];
  const bucketSize = firstRow[binEndIndex] - firstRow[binStartIndex];
  const min = firstRow[binStartIndex];
  const max = lastRow[binEndIndex];

  const thresholdLines = generateThresholdLines(styles.thresholdOptions);
  const defaultFill = getColors().categories[0];

  // Histogram series
  const series = seriesFields.map((seriesField, index) => {
    const name = getSeriesDisplayName(seriesField, Object.values(axisColumnMappings));
    const seriesFieldIndex = headers.indexOf(seriesField);
    return {
      type: 'custom',
      id: seriesField,
      name,
      encode: {
        x: binStartField,
        y: seriesField,
      },
      ...(index === 0 && thresholdLines),
      renderItem(params, api) {
        const xValue = api.value(binStartIndex) as number;
        const yValue = api.value(seriesFieldIndex) as number;

        // Convert data coordinates to pixel coordinates
        const start = api.coord([xValue, 0]);
        const end = api.coord([xValue + bucketSize, yValue]);
        const width = api.coord([xValue + bucketSize, 0])[0] - start[0];
        const height = start[1] - end[1];

        return {
          type: 'group',
          children: [
            {
              type: 'rect',
              shape: {
                x: start[0],
                y: end[1],
                width,
                height,
              },
              style: {
                ...(styles.useThresholdColor
                  ? { fill: getValueColorByThreshold(yValue, styles.thresholdOptions) }
                  : { fill: defaultFill }),
                ...(styles.showBarBorder
                  ? { stroke: styles.barBorderColor }
                  : { stroke: getColors().backgroundShade }),
                ...(styles.showBarBorder ? { lineWidth: styles.barBorderWidth } : { lineWidth: 1 }),
              },
            },
          ],
        };
      },
    };
  }) as CustomSeriesOption[];
  newState.series = series;

  // Histogram tooltip
  const tooltip: EChartsOption['tooltip'] = {
    trigger: 'item',
    show: styles.tooltipOptions.mode !== 'hidden',
    className: 'chartCustomTooltip',
    formatter(params) {
      if (!Array.isArray(params) && Array.isArray(params.value)) {
        const dimensionNames = params.dimensionNames ?? [];
        const bucketStart =
          format.encodeHTML(String(params.value[dimensionNames.indexOf(binStartField)])) ?? '-';
        const bucketEnd =
          format.encodeHTML(String(params.value[dimensionNames.indexOf(binEndField)])) ?? '-';
        const value =
          format.encodeHTML(String(params.value[dimensionNames.indexOf(params.seriesId ?? '')])) ??
          '-';
        return `${bucketStart} - ${bucketEnd}<p><span>${
          params.seriesName ?? 'value'
        }</span> <b>${value}</b></p>`;
      }
      return '-';
    },
  };

  if (newState.baseConfig) {
    const newBaseConfig = { ...newState.baseConfig };
    newBaseConfig.tooltip = tooltip;
    newState.baseConfig.tooltip = tooltip;
  } else {
    newState.baseConfig = {
      tooltip,
    };
  }

  // Histogram axis config
  if (newState.xAxisConfig) {
    const xAxisConfig = { ...newState.xAxisConfig };
    xAxisConfig.min = min;
    xAxisConfig.max = max;
    xAxisConfig.interval = bucketSize;
    newState.xAxisConfig = xAxisConfig;
  }

  return newState;
};
