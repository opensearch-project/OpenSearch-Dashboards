/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomSeriesOption, EChartsOption, format } from 'echarts';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { getSeriesDisplayName } from '../utils/series';
import {
  formatSeriesValueLabel,
  generateThresholdLines,
  getValueColorByThreshold,
} from '../utils/utils';
import { HistogramChartStyle } from './histogram_vis_config';
import { getColors } from '../theme/default_colors';
import { getDecimalPrecision, roundToPrecision } from '../utils/data_transformation';
import { formatUnitValue } from '../style_panel/unit/collection';

interface Options {
  styles: HistogramChartStyle;
  binStartField: string;
  binEndField: string;
  seriesFields: string[] | ((headers?: string[]) => string[]);
}

// Histogram applies unit on bucket value
export const formatHistogramBucketValue = (
  value: unknown,
  bucketPrecision: number,
  unit?: { unitId?: string; decimals?: number; unitSuffix?: string }
): string => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  const rounded = roundToPrecision(numericValue, bucketPrecision);
  if (unit && (unit.unitId || unit.decimals != null || unit.unitSuffix)) {
    return formatUnitValue(rounded, unit.unitId, unit.decimals, unit.unitSuffix);
  }
  return rounded.toString();
};

export const formatBucketValue = (value: unknown, unit?: { decimals?: number }): string => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return formatSeriesValueLabel(numericValue, undefined, unit?.decimals);
};

export const createHistogramSeries =
  <T extends BaseChartStyle>(options: Options): PipelineFn<T> =>
  (state) => {
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
    // Use the stored bucket boundary values to decide label precision. Computing
    // precision from the derived interval can introduce binary floating-point
    // artifacts, for example 1.2 - 1 -> 0.19999999999999996.
    const bucketPrecision = Math.max(
      getDecimalPrecision(Number(firstRow[binStartIndex])),
      getDecimalPrecision(Number(firstRow[binEndIndex]))
    );
    const bucketSize = roundToPrecision(
      firstRow[binEndIndex] - firstRow[binStartIndex],
      bucketPrecision
    );
    const min = firstRow[binStartIndex];
    const max = lastRow[binEndIndex];

    const thresholdLines = generateThresholdLines(styles.thresholdOptions);
    const defaultFill = getColors().categories[0];

    // Histogram series
    const series = seriesFields.map((seriesField, index) => {
      const name = getSeriesDisplayName(seriesField, Object.values(axisColumnMappings).flat());
      const seriesFieldIndex = headers.indexOf(seriesField);
      return {
        type: 'custom',
        id: seriesField,
        name,
        clip: true,
        encode: {
          x: binStartField,
          y: seriesField,
        },

        ...(index === 0 && thresholdLines),
        renderItem(params, api) {
          const xValue = api.value(binStartIndex) as number;
          const yValue = api.value(seriesFieldIndex) as number;
          const valueLabel = formatSeriesValueLabel(yValue, false, styles.decimals);

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
                  ...(styles.showBarBorder
                    ? { lineWidth: styles.barBorderWidth }
                    : { lineWidth: 1 }),
                },
              },
              ...(styles.showValue
                ? [
                    {
                      type: 'text',
                      silent: true,
                      style: {
                        x: start[0] + width / 2,
                        y: end[1],
                        text: valueLabel,
                        textAlign: 'center',
                        textVerticalAlign: 'bottom',
                        fill: getColors().text,
                      },
                    },
                  ]
                : []),
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
            format.encodeHTML(
              formatHistogramBucketValue(
                params.value[dimensionNames.indexOf(binStartField)],
                bucketPrecision,
                styles
              )
            ) ?? '-';
          const bucketEnd =
            format.encodeHTML(
              formatHistogramBucketValue(
                params.value[dimensionNames.indexOf(binEndField)],
                bucketPrecision,
                styles
              )
            ) ?? '-';
          const value =
            format.encodeHTML(
              String(params.value[dimensionNames.indexOf(params.seriesId ?? '')])
            ) ?? '-';
          return `${bucketStart} - ${bucketEnd}<p><span>${
            params.seriesName ?? 'value'
          }</span> <b>${formatBucketValue(value, styles)}</b></p>`;
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

      const isMinMaxInValid =
        (styles.min != null && styles.max != null && styles.min >= styles.max) ||
        (styles.min != null && styles.min >= max) ||
        (styles.max != null && styles.max <= min);
      xAxisConfig.min = (isMinMaxInValid ? undefined : styles.min) ?? min;
      xAxisConfig.max = (isMinMaxInValid ? undefined : styles.max) ?? max;
      xAxisConfig.interval = bucketSize;
      xAxisConfig.axisLabel = {
        ...xAxisConfig.axisLabel,
        formatter: (value: unknown) => formatHistogramBucketValue(value, bucketPrecision, styles),
      };
      newState.xAxisConfig = xAxisConfig;
    }

    // The Y axis is the bucket count, not the measured field.
    // Delete any unit formatter or value label
    if (newState.yAxisConfig && !Array.isArray(newState.yAxisConfig)) {
      const yAxisConfig = { ...newState.yAxisConfig };
      if (yAxisConfig.axisLabel?.formatter) {
        yAxisConfig.axisLabel = { ...yAxisConfig.axisLabel, formatter: undefined };
      }
      delete yAxisConfig.min;
      delete yAxisConfig.max;
      newState.yAxisConfig = yAxisConfig;
    }

    return newState;
  };
