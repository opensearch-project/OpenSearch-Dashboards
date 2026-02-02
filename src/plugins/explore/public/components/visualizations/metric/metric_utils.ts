/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomSeriesOption, LineSeriesOption } from 'echarts';
import { BaseChartStyle, EChartsSpecState, PipelineFn } from '../utils/echarts_spec';
import { getSeriesDisplayName } from '../utils/series';
import { MetricChartStyle } from './metric_vis_config';
import { DEFAULT_GREY, getColors } from '../theme/default_colors';
import { calculatePercentage, calculateValue } from '../utils/calculation';
import { getUnitById, showDisplayValue } from '../style_panel/unit/collection';
import { Threshold } from '../types';

function targetFillColor(
  useThresholdColor: boolean,
  threshold?: Threshold[],
  baseColor?: string,
  calculatedValue?: number
) {
  const colorPalette = getColors();
  const newThreshold = threshold ?? [];

  if (calculatedValue === undefined) {
    return useThresholdColor ? DEFAULT_GREY : colorPalette.text;
  }

  let textColor = baseColor ?? getColors().statusGreen;

  for (let i = 0; i < newThreshold.length; i++) {
    const { value, color } = newThreshold[i];
    if (calculatedValue >= value) textColor = color;
  }

  const fillColor = useThresholdColor ? textColor : colorPalette.text;

  return fillColor;
}

export const createMetricChartSeries = ({
  seriesFields,
  dateField,
  styles,
}: {
  seriesFields: string[];
  styles: MetricChartStyle;
  dateField?: string;
}): PipelineFn => (state) => {
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };

  const colorPalette = getColors();

  const series: Array<LineSeriesOption | CustomSeriesOption> = [];
  seriesFields.forEach((item: string) => {
    if (!transformedData.length || !Array.isArray(transformedData[0])) {
      // No dataset/header row available; keep rendering stable.
      return;
    }

    const seriesDisplayName = getSeriesDisplayName(item, Object.values(axisColumnMappings));

    const numericalValues: number[] = [];
    const seriesIndex = transformedData[0].indexOf(item);
    if (seriesIndex < 0) return;

    for (let i = 1; i < transformedData.length; i++) {
      numericalValues.push(transformedData[i][seriesIndex]);
    }

    const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
    const isValidNumber =
      calculatedValue !== undefined &&
      typeof calculatedValue === 'number' &&
      !isNaN(calculatedValue);

    const selectedUnit = getUnitById(styles?.unitId);

    const displayValue = showDisplayValue(isValidNumber, selectedUnit, calculatedValue);

    const fillColor = targetFillColor(
      styles.useThresholdColor ?? false,
      styles.thresholdOptions?.thresholds,
      styles.thresholdOptions?.baseColor,
      calculatedValue
    );

    let changeText = '';
    let changeColor = colorPalette.text;
    if (styles.showPercentage) {
      const percentage = calculatePercentage(numericalValues);
      if (percentage === undefined) {
        changeText = '-';
      } else {
        changeText = `${percentage > 0 ? '+' : ''}${(percentage * 100).toFixed(2)}%`;
      }

      if (percentage !== undefined && percentage > 0) {
        if (styles.percentageColor === 'standard') {
          changeColor = colorPalette.statusGreen;
        } else if (styles.percentageColor === 'inverted') {
          changeColor = colorPalette.statusRed;
        } else {
          changeColor = colorPalette.statusGreen;
        }
      }
      if (percentage !== undefined && percentage < 0) {
        if (styles.percentageColor === 'standard') {
          changeColor = colorPalette.statusRed;
        } else if (styles.percentageColor === 'inverted') {
          changeColor = colorPalette.statusGreen;
        } else {
          changeColor = colorPalette.statusRed;
        }
      }
    }

    // If date field is set, it will display a sparkline
    if (dateField) {
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
          opacity: 0.5,
        },
      });
    }

    series.push({
      type: 'custom',
      ...(dateField && { encode: { x: dateField } }),
      z: 10,
      renderItem(params, api) {
        const width = api.getWidth();
        const height = api.getHeight();

        const textSize = Math.min(width, height) / 20;

        // Dynamic font sizes based on chart dimensions
        const titleFontSize = styles.titleSize ? styles.titleSize : 1.5 * textSize;
        const valueFontSize = styles.fontSize
          ? styles.fontSize
          : 5 * textSize * (selectedUnit?.fontScale ?? 1);
        const changeFontSize = styles.percentageSize ? styles.percentageSize : 2 * textSize;

        return {
          type: 'group',
          x: width / 2,
          y: height * 0.1,
          children: [
            {
              type: 'text',
              style: {
                x: 0,
                y: 0,
                text: styles.showTitle ? styles.title || seriesDisplayName : '',
                fontSize: titleFontSize,
                fontWeight: 'normal',
                fill: colorPalette.text,
                textAlign: 'center',
              },
            },
            {
              type: 'text',
              style: {
                x: 0,
                y: titleFontSize + 5,
                text: displayValue,
                fontSize: valueFontSize,
                fontWeight: 'bold',
                fill: fillColor,
                textAlign: 'center',
              },
            },
            {
              type: 'text',
              style: {
                x: 0,
                y: titleFontSize + valueFontSize + 10,
                text: changeText,
                fontSize: changeFontSize,
                fill: changeColor,
                textAlign: 'center',
              },
            },
          ],
        };
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
      top: '50%',
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
