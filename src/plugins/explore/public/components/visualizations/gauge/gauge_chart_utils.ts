/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GaugeSeriesOption, CustomSeriesOption } from 'echarts';
import { PipelineFn, EChartsSpecState, BaseChartStyle } from '../utils/echarts_spec';
import { GaugeChartStyle } from './gauge_vis_config';
import { getSeriesDisplayName } from '../utils/series';
import { calculateValue } from '../utils/calculation';
import { getUnitById, showDisplayValue } from '../style_panel/unit/collection';
import {
  getMaxAndMinBase,
  mergeThresholdsWithBase,
  locateThreshold,
} from '../style_panel/threshold/threshold_utils';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';

export function generateArcExpression(startValue: number, endValue: number, fillColor: string) {
  return {
    mark: {
      type: 'arc',
      y: { expr: 'centerY' },
      x: { expr: 'centerX' },
      radius: { expr: 'innerRadius * 0.98' },
      radius2: { expr: 'innerRadius * 0.96' },
      theta: {
        expr: `theta_single_arc + (theta2_single_arc - theta_single_arc) * (( ${startValue} - minValue) / (maxValue - minValue))`,
      },
      theta2: {
        expr: `theta_single_arc + (theta2_single_arc - theta_single_arc) * (( ${endValue} - minValue) / (maxValue - minValue))`,
      },
      fill: fillColor,
    },
  };
}

export const createGaugeSeries = ({
  styles,
  seriesFields,
}: {
  styles: GaugeChartStyle;
  seriesFields: string[];
}): PipelineFn => (state) => {
  const { transformedData = [], axisColumnMappings } = state;
  const newState = { ...state };

  const series: Array<GaugeSeriesOption | CustomSeriesOption> = [];

  // TODO use instance width and height
  const fontSizeFactor = 12;

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
    const validValues = numericalValues.filter((v) => !isNaN(v));
    const maxNumber = validValues.length > 0 ? Math.max(...validValues) : 0;
    const minNumber = validValues.length > 0 ? Math.min(...validValues) : 0;

    const isValidNumber =
      calculatedValue !== undefined &&
      typeof calculatedValue === 'number' &&
      !isNaN(calculatedValue);

    const selectedUnit = getUnitById(styles?.unitId);

    const displayValue = showDisplayValue(isValidNumber, selectedUnit, calculatedValue);

    const { minBase, maxBase } = getMaxAndMinBase(
      minNumber,
      maxNumber,
      styles?.min,
      styles?.max,
      calculatedValue
    );

    const { textColor, mergedThresholds } = mergeThresholdsWithBase(
      minBase,
      maxBase,
      styles?.thresholdOptions?.baseColor,
      styles?.thresholdOptions?.thresholds,
      calculatedValue
    );

    const targetThreshold = locateThreshold(mergedThresholds, calculatedValue);

    const valueArcColor = targetThreshold?.color ?? 'transparent';

    // Gauge colors are defined as “up to this point”, not “from this point” — each [percent, color] means use this color until this percent.
    const normalizeThresholds =
      maxBase > minBase
        ? mergedThresholds.map((t, index) => {
            if (index > 0)
              return [(t.value - minBase) / (maxBase - minBase), mergedThresholds[index - 1].color];
            return [0, t.color];
          })
        : [];

    if (normalizeThresholds.length > 0) {
      normalizeThresholds.push([1, mergedThresholds[mergedThresholds.length - 1].color]);
    }

    const thresholdArc = {
      type: 'gauge',
      center: ['50%', '60%'],
      startAngle: 200,
      radius: '100%',
      endAngle: -20,
      z: 5,
      min: minBase,
      max: maxBase,
      progress: {
        show: true,
        width: fontSizeFactor + 2,
        itemStyle: {
          color: getColors().backgroundShade,
        },
      },
      pointer: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          width: fontSizeFactor + 4,
          ...(normalizeThresholds.length > 0 && { color: normalizeThresholds }),
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      anchor: {
        show: false,
      },
      title: {
        show: false,
      },
      detail: {
        show: false,
      },
      data: [
        {
          value: maxBase,
          name: styles?.title || seriesDisplayName,
        },
      ],
    } as GaugeSeriesOption;

    const valueArc: GaugeSeriesOption = {
      type: 'gauge',
      center: ['50%', '60%'],
      radius: '100%',
      startAngle: 200,
      endAngle: -20,
      z: 10,
      min: minBase,
      max: maxBase,
      itemStyle: {
        color: valueArcColor,
      },
      progress: {
        show: true,
        width: fontSizeFactor,
      },
      pointer: {
        show: false,
      },

      axisLine: {
        show: true,
        lineStyle: {
          width: fontSizeFactor,
          color: [
            [1, DEFAULT_GREY], // remaining grey part
          ],
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      detail: {
        show: false,
      },
      data: [
        {
          value: calculatedValue,
        },
      ],
    };

    const textCustom: CustomSeriesOption = {
      type: 'custom',
      coordinateSystem: 'polar',
      tooltip: { show: false },
      data: [
        {
          value: calculatedValue,
        },
      ],
      renderItem(params, api) {
        const width = api.getWidth();
        const height = api.getHeight();

        const textSizeFactor = Math.min(width, height) / 20;
        const valueFontSize = 2 * textSizeFactor * (selectedUnit?.fontScale ?? 1);
        const titleFontSize = textSizeFactor / 2;
        return {
          type: 'group',
          x: width * 0.5,
          y: height * 0.6,
          children: [
            {
              type: 'text' as const,
              style: {
                x: 0,
                y: -2 * textSizeFactor * (selectedUnit?.fontScale ?? 1),
                text: displayValue,
                textAlign: 'center',
                fontSize: valueFontSize,
                fontWeight: 'bold',
                fill: textColor,
              },
            },
            ...(styles.showTitle
              ? [
                  {
                    type: 'text' as const,
                    style: {
                      x: 0,
                      y: textSizeFactor * (selectedUnit?.fontScale ?? 1),
                      text: styles?.title || seriesDisplayName,
                      textAlign: 'center',
                      fontSize: titleFontSize,
                      fill: getColors().text,
                    },
                  },
                ]
              : []),
          ],
        };
      },
    };

    series.push(valueArc);
    series.push(thresholdArc);
    series.push(textCustom);
  });

  newState.series = series;

  return newState;
};

export const assembleGaugeSpec = <T extends BaseChartStyle>(
  state: EChartsSpecState<T>
): EChartsSpecState<T> => {
  const { baseConfig, transformedData = [], series } = state;

  const spec = {
    ...baseConfig,
    // Polar coordinate for text layer
    angleAxis: { show: false },
    radiusAxis: {
      show: false,
    },
    polar: {
      center: ['50%', '60%'],
      radius: '100%',
    },
    dataset: { source: transformedData },
    series,
  };

  return { ...state, spec };
};
