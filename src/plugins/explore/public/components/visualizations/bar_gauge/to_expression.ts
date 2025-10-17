/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { VisColumn, AxisColumnMappings, VEGASCHEMA, Threshold } from '../types';
import { calculateValue } from '../utils/calculation';
import { DEFAULT_GREY, getColors, getUnfilledArea } from '../theme/default_colors';
import { getSchemaByAxis } from '../utils/utils';
import {
  getBarOrientation,
  thresholdsToGradient,
  symbolOpposite,
  darkenColor,
  processThresholds,
  generateParams,
} from './bar_gauge_utils';
import { getUnitById, showDisplayValue } from '../style_panel/unit/collection';

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

  const isXaxisNumerical = axisColumnMappings?.x?.schema === 'numerical';
  const adjustEncoding =
    (!isXaxisNumerical && styleOptions?.exclusive?.orientation === 'horizontal') ||
    (isXaxisNumerical && styleOptions?.exclusive?.orientation !== 'horizontal');

  const processedSymbol = [
    `${symbolOpposite(styleOptions.exclusive.orientation, `${isXaxisNumerical ? 'x' : 'y'}`)}`,
  ];

  const numericalMapping = xAxis?.schema === 'numerical' ? xAxis : yAxis;
  const numericField = numericalMapping?.column;
  const catField = xAxis?.schema === 'numerical' ? yAxis?.column : xAxis?.column;
  const catCounts =
    xAxis?.schema === 'numerical' ? yAxis?.uniqueValuesCount : xAxis?.uniqueValuesCount;

  const groups = catField ? groupBy(transformedData, (item) => item[catField]) : [];

  const newRecord = [];
  let maxNumber: number = 0;
  let maxTextLength: number = 0;

  const selectedUnit = getUnitById(styleOptions?.unitId);

  for (const g1 of Object.values(groups)) {
    if (numericField) {
      const calculate = calculateValue(
        g1.map((d) => d[numericField]),
        styleOptions.valueCalculation
      );
      if (calculate) {
        maxNumber = Math.max(maxNumber, calculate);
      }

      const isValidNumber =
        calculate !== undefined && typeof calculate === 'number' && !isNaN(calculate);

      const displayValue = showDisplayValue(isValidNumber, selectedUnit, calculate);
      maxTextLength = Math.max(maxTextLength, String(displayValue).length);
      newRecord.push({
        ...g1[0],
        [numericField]: calculate,
        displayValue,
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

  // invalid case: max <= min and min > maxNumber, only show the base threshold
  const completeThreshold = [
    { value: styleOptions?.min ?? 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...validThresholds,
    ...((styleOptions?.max && styleOptions?.min && styleOptions.max <= styleOptions.min) ||
    (styleOptions?.min && styleOptions.min > maxNumber)
      ? []
      : [
          {
            value: styleOptions.max ?? maxNumber,
            color: darkenColor(lastThreshold?.color ?? styleOptions.thresholdOptions.baseColor, 2),
          } as Threshold,
        ]),
  ];

  const processedThresholds = processThresholds(completeThreshold);

  const gradientParams = generateParams(processedThresholds, styleOptions, isXaxisNumerical);

  const maxBase = styleOptions?.max ?? maxNumber;
  const minBase = styleOptions?.min ?? 0;

  const params = [
    { name: 'fontColor', value: getColors().text },
    {
      name: 'maxBase',
      value: Math.max(minBase, maxBase),
    },
    {
      name: 'minBase',
      value: styleOptions?.min ?? 0,
    },
    {
      name: 'fontFactor',
      expr: adjustEncoding ? `width/${catCounts}/${maxTextLength}/9` : `height/${maxTextLength}/18`,
    },
    ...gradientParams,
  ];

  const transformLayer = [
    {
      calculate: 'maxBase',
      as: 'maxVal',
    },
    {
      calculate: 'minBase',
      as: 'minVal',
    },
    ...thresholdsToGradient(processedThresholds),
  ];

  const encodingLayer = {
    y: {
      field: yAxis?.column,
      type: getSchemaByAxis(yAxis),
      ...yAxisStyle,
      ...(!adjustEncoding
        ? {
            domain: { expr: '[minBase,maxBase]' },
          }
        : {}),
    },
    x: {
      field: xAxis?.column,
      type: getSchemaByAxis(xAxis),
      ...xAxisStyle,
      ...(adjustEncoding
        ? {
            domain: { expr: '[minBase,maxBase]' },
          }
        : {}),
    },
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
        clip: true,
        fill: getUnfilledArea(),
      },
      encoding: {
        [`${processedSymbol}`]: {
          type: 'quantitative',
          field: 'maxVal',
        },
      },
    });
  }

  const generateTrans = (thresholds: Threshold[]) => {
    let expression = '';

    for (let i = thresholds.length - 1; i >= 1; i--) {
      expression += `datum['${numericField}'] >= datum.threshold${i} ? test${i} : `;
    }

    expression += `test0`;

    return expression;
  };

  if (styleOptions.exclusive.displayMode === 'gradient') {
    const gradientBar = {
      mark: { type: 'bar' },
      transform: [{ filter: `datum['${numericField}'] >= datum.minVal` }],
      encoding: {
        color: {
          value: {
            expr: generateTrans(processedThresholds),
          },
        },
      },
    };
    layers.push(gradientBar);
  }

  if (styleOptions.exclusive.displayMode === 'stack') {
    // dispose the last threshold
    const bars = processedThresholds.slice(0, -1)?.map((threshold, index) => {
      return {
        transform: [
          { calculate: `datum.threshold${index}`, as: 'gradStart' },
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
        layer: [
          {
            mark: {
              type: 'bar',
              clip: true,
              color: threshold.color,
            },
            encoding: {
              [`${processedSymbol}`]: {
                type: 'quantitative',
                field: 'gradEnd',
              },

              [`${processedSymbol}2`]: {
                field: 'gradStart',
              },
            },
          },
        ],
      };
    });

    layers.push(...bars);
  }

  if (styleOptions.exclusive.displayMode === 'basic') {
    const gradientBar = {
      mark: { type: 'bar' },
      transform: [{ filter: `datum['${numericField}'] >= datum.minVal` }],
      encoding: {
        color: {
          field: numericField,
          type: 'quantitative',
          scale: {
            type: 'threshold',
            //  last threshold which is just for max value capping in gradient mode
            domain: processedThresholds.map((t) => t.value).slice(0, -1),
            range: [DEFAULT_GREY, ...processedThresholds.map((t) => t.color)].slice(0, -1),
          },
          legend: null,
        },
      },
    };
    layers.push(gradientBar);
  }

  if (styleOptions.exclusive.valueDisplay !== 'hidden') {
    const nameLayer = {
      transform: [
        {
          calculate: `datum.minVal >= datum.maxVal ? datum.minVal : datum.maxVal`,
          as: 'textY',
        },
      ],
      mark: {
        type: 'text',

        ...(adjustEncoding
          ? {
              align: 'left',
              baseline: 'middle',
            }
          : { baseline: 'bottom' }),

        dx: adjustEncoding ? { expr: 'fontFactor*3' } : 0,
        dy: adjustEncoding ? 0 : { expr: '-fontFactor*3' },
        fontSize: { expr: 'fontFactor * 10' },
        ...(styleOptions.exclusive?.valueDisplay === 'textColor'
          ? { fill: { expr: 'fontColor' } }
          : {}),
      },
      encoding: {
        [`${processedSymbol}`]: {
          type: 'quantitative',
          field: 'textY',
        },
        text: {
          field: 'displayValue',
        },
        color: {
          field: numericField,
          type: 'quantitative',
          scale: {
            type: 'threshold',
            domain: processedThresholds.map((t) => t.value).slice(0, -1),
            range: [DEFAULT_GREY, ...processedThresholds.map((t) => t.color)].slice(0, -1),
          },
          legend: null,
        },
      },
    };
    layers.push(nameLayer);
  }

  const baseSpec = {
    $schema: VEGASCHEMA,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName || `${yAxis?.name} by ${xAxis?.name}`
      : undefined,
    data: { values: newRecord },
    params,
    transform: transformLayer,
    encoding: encodingLayer,
    layer: layers,
  };

  return baseSpec;
};
