/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { VisColumn, AxisColumnMappings, VEGASCHEMA, Threshold } from '../types';
import { calculateValue } from '../utils/calculation';
import { darkenColor, DEFAULT_GREY, getUnfilledArea, getColors } from '../theme/default_colors';
import { getSchemaByAxis } from '../utils/utils';
import {
  getBarOrientation,
  thresholdsToGradient,
  symbolOpposite,
  getDisplayMode,
} from './bar_gauge_utils';

export const createBarGaugeSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: BarGaugeChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getBarOrientation(
    styleOptions,
    axisColumnMappings
  );

  const numericalMapping = xAxis?.schema === 'numerical' ? xAxis : yAxis;
  const numericField = numericalMapping?.column;
  const catField = xAxis?.schema === 'numerical' ? yAxis?.column : xAxis?.column;

  const groups = catField ? groupBy(transformedData, (item) => item[catField]) : [];

  const newRecord = [];
  let maxNumber: number = 0;
  for (const g1 of Object.values(groups)) {
    if (numericField) {
      const calculate = calculateValue(
        g1.map((d) => d[numericField]),
        styleOptions.valueCalculation
      );
      if (calculate) {
        maxNumber = Math.max(maxNumber, calculate);
      }

      newRecord.push({
        ...g1[0],
        [numericField]: calculate,
      });
    }
  }

  const validThresholds =
    styleOptions.thresholdOptions.thresholds?.filter(
      (t) =>
        t.value <= maxNumber &&
        t.value >= (styleOptions.min ?? 0) &&
        t.value <= (styleOptions.max ?? Infinity)
    ) ?? [];
  const lastThreshold = validThresholds[validThresholds.length - 1];

  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...validThresholds,
    {
      value: maxNumber,
      color: darkenColor(lastThreshold?.color ?? styleOptions.thresholdOptions.baseColor, 2),
    } as Threshold,
  ];

  const params = [
    { name: 'fontRef', expr: 'min(width/2, height/2)' },
    { name: 'fontFactor', expr: '(fontRef/5)/25' },
    { name: 'fontColor', value: getColors().text },
  ];

  const transformLayer = [
    { joinaggregate: [{ op: 'max', field: numericField, as: 'maxVal' }] },
    ...thresholdsToGradient(completeThreshold),
  ];

  const encodingLayer = {
    y: {
      field: yAxis?.column,
      type: getSchemaByAxis(yAxis),
      ...yAxisStyle,
    },
    x: {
      field: xAxis?.column,
      type: getSchemaByAxis(xAxis),
      ...xAxisStyle,
    },
    ...(styleOptions.exclusive.displayMode === 'basic'
      ? {
          color: {
            field: numericField,
            type: 'quantitative',
            scale: {
              type: 'threshold',
              domain: completeThreshold.map((t) => t.value),
              range: [DEFAULT_GREY, ...completeThreshold.map((t) => t.color)],
            },
            legend: null,
          },
        }
      : {}),
    ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
      tooltip: [
        {
          field: yAxis?.column,
          type: getSchemaByAxis(yAxis),
          title: yAxis?.name,
        },
        {
          field: xAxis?.column,
          type: getSchemaByAxis(xAxis),
          title: xAxis?.name,
        },
      ],
    }),
  };

  const layers: any[] = [];

  if (styleOptions.exclusive.showUnfilledArea) {
    layers.push({
      mark: {
        type: 'bar',
        fill: getUnfilledArea(),
      },
      encoding: {
        [`${symbolOpposite(styleOptions.exclusive.orientation, 'y')}`]: {
          type: 'quantitative',
          field: 'maxVal',
        },
      },
    });
  }

  // dispose the last threshold
  const bars = completeThreshold.slice(0, -1)?.map((threshold, index) => {
    return {
      transform: [
        { calculate: `datum.threshold${index}*0.99`, as: 'gradStart' },
        { calculate: `datum.threshold${index + 1}`, as: 'gradEndTemp' },
        {
          calculate: `datum['${numericField}'] < datum.gradEndTemp ? datum['${numericField}']: datum.gradEndTemp`,
          as: 'gradEnd',
        },
        {
          calculate: `datum['${numericField}'] < datum.gradEndTemp`,
          as: 'useSolidColor',
        },
        { filter: `datum['${numericField}'] >= datum.threshold${index}` },
      ],
      // Vega-Lite doesn't support dynamically changing the color of gradient steps directly.
      // As a workaround, add an extra layer on top of the gradient bar.
      // This ensures that the end of the color bar reflects the threshold color accurately not the in-between gradient color

      layer: [
        {
          mark: {
            type: 'bar',
            ...getDisplayMode(
              styleOptions.exclusive.orientation,
              styleOptions.exclusive.displayMode,
              threshold,
              completeThreshold[index + 1].color
            ),
          },
          encoding: {
            [`${symbolOpposite(styleOptions.exclusive.orientation, 'y')}`]: {
              type: 'quantitative',
              field: 'gradEnd',
            },
            [`${symbolOpposite(styleOptions.exclusive.orientation, 'y')}2`]: { field: 'gradStart' },
          },
        },

        {
          mark: {
            type: 'bar',
            ...getDisplayMode(
              styleOptions.exclusive.orientation,
              styleOptions.exclusive.displayMode,
              threshold,
              darkenColor(threshold.color ?? DEFAULT_GREY, 2)
            ),
            fillOpacity: { expr: `datum.useSolidColor ? 1 : 0` },
          },
          encoding: {
            [`${symbolOpposite(styleOptions.exclusive.orientation, 'y')}`]: {
              type: 'quantitative',
              field: 'gradEnd',
            },
            [`${symbolOpposite(styleOptions.exclusive.orientation, 'y')}2`]: { field: 'gradStart' },
          },
        },
      ],
    };
  });

  layers.push(...bars);

  if (styleOptions.exclusive.namePlacement === 'auto') {
    const nameLayer = {
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'middle',
        dx: styleOptions.exclusive.orientation === 'horizontal' ? { expr: 'fontFactor*15' } : 0,
        dy: styleOptions.exclusive.orientation === 'horizontal' ? 0 : { expr: '-fontFactor*5' },
        fontSize: { expr: 'fontFactor * 10' },
        ...(styleOptions.exclusive?.valueDisplay === 'textColor'
          ? { fill: { expr: 'fontColor' } }
          : {}),
      },
      encoding: {
        text: {
          field: numericField,
          type: 'quantitative',
        },
        color: {
          field: numericField,
          type: 'quantitative',
          scale: {
            type: 'threshold',
            domain: completeThreshold.map((t) => t.value),
            range: [DEFAULT_GREY, ...completeThreshold.map((t) => t.color)],
          },
          legend: null,
        },
      },
    };
    layers.push(nameLayer);
  }

  const baseSpec = {
    $schema: VEGASCHEMA,
    params,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName || `${yAxis?.name} by ${xAxis?.name}`
      : undefined,
    data: { values: newRecord },
    transform: transformLayer,
    encoding: encodingLayer,
    layer: layers,
  };

  return baseSpec;
};
