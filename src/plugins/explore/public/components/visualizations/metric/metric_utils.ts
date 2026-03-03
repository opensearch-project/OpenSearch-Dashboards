/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineSeriesOption } from 'echarts';
import { BaseChartStyle, EChartsSpecState, PipelineFn } from '../utils/echarts_spec';
import { getSeriesDisplayName } from '../utils/series';
import { MetricChartStyle } from './metric_vis_config';
import { getColors } from '../theme/default_colors';
import { calculateValue } from '../utils/calculation';

export const createMetricChartSeries = ({
  seriesFields,
  dateField,
  styles,
}: {
  seriesFields: string[];
  styles: MetricChartStyle;
  dateField: string;
}): PipelineFn => (state) => {
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };
  const colorPalette = getColors();

  const series: LineSeriesOption[] = [];
  seriesFields.forEach((item: string) => {
    if (!transformedData.length || !Array.isArray(transformedData[0])) {
      // No dataset/header row available; keep rendering stable.
      return;
    }

    const headers = transformedData[0] ?? [];
    const dataColumnIndex = headers.indexOf(item);
    const numericalValues: unknown[] = [];
    transformedData.forEach((d, i) => {
      if (i >= 1) {
        numericalValues.push(d[dataColumnIndex]);
      }
    });

    let sparklineColor: string;
    if (styles.colorMode === 'background_solid' || styles.colorMode === 'background_gradient') {
      sparklineColor = 'rgba(255, 255, 255, 0.7)';
    } else {
      if (
        styles.useThresholdColor &&
        (styles.colorMode === 'value' || styles.colorMode === 'none')
      ) {
        const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
        const thresholds = styles.thresholdOptions?.thresholds ?? [];
        let thresholdColor = styles.thresholdOptions?.baseColor ?? colorPalette.statusGreen;

        if (calculatedValue !== undefined) {
          for (let i = 0; i < thresholds.length; i++) {
            const { value, color } = thresholds[i];
            if (calculatedValue >= value) thresholdColor = color;
          }
        }
        sparklineColor = thresholdColor;
      } else {
        sparklineColor = colorPalette.categories[0];
      }
    }

    const seriesDisplayName = getSeriesDisplayName(item, Object.values(axisColumnMappings));

    series.push({
      name: seriesDisplayName,
      type: 'line' as const,
      z: 1,
      encode: {
        x: dateField,
        y: item,
      },
      symbol: 'none',
      areaStyle: {
        color: sparklineColor,
        opacity: 0.5,
      },
      lineStyle: {
        width: 1,
        color: sparklineColor,
      },
    });
  });

  newState.series = series;
  return newState;
};

export const assembleForMetric = <T extends BaseChartStyle>(state: EChartsSpecState<T>) => {
  // Metric sparkline doesn't have x/y axis
  const xAxis = Array.isArray(state.spec?.xAxis)
    ? state.spec.xAxis.map((a) => ({ ...a, show: false, silent: true }))
    : { ...state.spec?.xAxis, show: false, silent: true };
  const yAxis = Array.isArray(state.spec?.yAxis)
    ? state.spec.yAxis.map((a) => ({ ...a, show: false, silent: true }))
    : { ...state.spec?.yAxis, show: false, silent: true };

  const spec = {
    ...state.spec,
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis,
    yAxis,
    tooltip: {
      ...state.spec?.tooltip,
      show: false,
    },
    legend: {
      ...state.spec?.legend,
      show: false,
    },
  };
  return { ...state, spec };
};
