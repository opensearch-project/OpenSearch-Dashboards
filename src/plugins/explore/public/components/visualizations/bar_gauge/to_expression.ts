/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { BarGaugeChartStyle } from './bar_gauge_vis_config';
import { VisColumn, AxisColumnMappings, VEGASCHEMA, Threshold, VisFieldType } from '../types';
import { calculateValue } from '../utils/calculation';
import { getColors } from '../theme/default_colors';
import { getSchemaByAxis } from '../utils/utils';
import {
  getBarOrientation,
  thresholdsToGradient,
  symbolOpposite,
  processThresholds,
  generateParams,
} from './bar_gauge_utils';
import { getUnitById, showDisplayValue } from '../style_panel/unit/collection';
import { mergeThresholdsWithBase } from '../style_panel/threshold/threshold_utils';

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
  const adjustEncoding = xAxis?.schema === VisFieldType.Numerical;

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
  let maxNumber: number = -Infinity;
  let minNumber: number = Infinity;
  let maxTextLength: number = 0;

  const selectedUnit = getUnitById(styleOptions?.unitId);

  for (const g1 of Object.values(groups)) {
    if (numericField) {
      const calculate = calculateValue(
        g1.map((d) => d[numericField]),
        styleOptions.valueCalculation
      );
      const isValidNumber =
        calculate !== undefined && typeof calculate === 'number' && !isNaN(calculate);

      if (calculate) {
        maxNumber = Math.max(maxNumber, isValidNumber ? calculate : -Infinity);
        minNumber = Math.min(minNumber, isValidNumber ? calculate : Infinity);
      }

      const displayValue = showDisplayValue(isValidNumber, selectedUnit, calculate);
      maxTextLength = Math.max(maxTextLength, String(displayValue).length);
      newRecord.push({
        ...g1[0],
        [numericField]: isValidNumber ? calculate : null,
        displayValue,
      });
    }
  }

  // To support negative values, when all the values are above 0, take minBase as 0 to start a bar.
  // Similarly, when all values are below 0, take maxBase as 0 to end a bar

  const maxBase = styleOptions?.max ?? Math.max(maxNumber, 0);
  const minBase = styleOptions?.min ?? Math.min(minNumber, 0);

  const invalidCase = minNumber === Infinity || minBase >= maxBase || minBase > maxNumber;

  // text color only display the corresponding threshold color and ignore min/max control
  const allThresholds =
    !styleOptions?.thresholdOptions?.thresholds ||
    styleOptions?.thresholdOptions?.thresholds?.length < 1
      ? [
          {
            value: minBase,
            color: styleOptions?.thresholdOptions?.baseColor ?? getColors().statusGreen,
          },
        ]
      : styleOptions?.thresholdOptions?.thresholds;

  const { textColor, mergedThresholds } = mergeThresholdsWithBase(
    minBase,
    maxBase,
    styleOptions?.thresholdOptions?.baseColor,
    styleOptions?.thresholdOptions?.thresholds
  );

  // transfer value to threshold
  const valueToThreshold = [];

  for (const record of newRecord) {
    for (let i = mergedThresholds.length - 1; i >= 0; i--) {
      if (numericField && record[numericField] >= mergedThresholds[i].value) {
        valueToThreshold.push({ value: record[numericField], color: mergedThresholds[i].color });
        break;
      }
    }
  }

  // only use value-based thresholds in gradient mode
  const finalThreshold = styleOptions?.exclusive.displayMode === 'gradient' ? valueToThreshold : [];

  const completeThreshold = [...mergedThresholds, ...(invalidCase ? [] : finalThreshold)].sort(
    (a, b) => a.value - b.value
  );

  // filter out value thresholds that are beyond maxBase, this ensures that the gradient mode on different bar is always aligned.
  const processedThresholds = processThresholds(
    completeThreshold.filter((t) => t.value <= maxBase)
  );

  const gradientParams = generateParams(processedThresholds, styleOptions, isXaxisNumerical);

  const scaleType = {
    scale: !invalidCase
      ? {
          domainMin: { expr: 'minBase' },
        }
      : { domain: [0, 100] }, // For invalid cases, use a fake domain to keep rendering consistent
  };

  const params = [
    { name: 'fontColor', value: getColors().text },
    {
      name: 'maxBase',
      value: invalidCase ? 100 : maxBase,
    },
    {
      name: 'minBase',
      value: invalidCase ? 0 : minBase,
    },
    {
      name: 'fontFactor',
      expr: !adjustEncoding
        ? `width/${catCounts && catCounts === 1 ? catCounts * 3 : catCounts}/${maxTextLength}/8`
        : `height/${catCounts && catCounts === 1 ? catCounts * 3 : catCounts}/${maxTextLength}/10`,
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
      ...(!adjustEncoding ? scaleType : {}),
    },
    x: {
      field: xAxis?.column,
      type: getSchemaByAxis(xAxis),
      ...xAxisStyle,
      ...(adjustEncoding ? scaleType : {}),
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
        fill: getColors().backgroundShade,
      },
      encoding: {
        [`${processedSymbol}`]: {
          type: 'quantitative',
          field: 'maxVal',
        },
        [`${processedSymbol}2`]: {
          type: 'quantitative',
          field: 'minVal',
        },
      },
    });
  }

  const generateTrans = (thresholds: Threshold[]) => {
    let expression = '';

    for (let i = thresholds.length - 1; i >= 1; i--) {
      expression += `datum['${numericField}'] >= datum.threshold${i} ? gradient${i} : `;
    }

    expression += `gradient0`;

    return expression;
  };

  let bars = [] as any;

  // Handle invalid domain cases (minBase >= maxBase or minBase > maxNumber)
  // invalid cases will not add the layer .
  if (invalidCase) {
    bars = [];
  } else if (styleOptions.exclusive.displayMode === 'stack') {
    bars = processedThresholds.map((threshold, index) => {
      return {
        transform: [
          { calculate: `datum.threshold${index}`, as: 'gradStart' },
          {
            calculate: `datum.threshold${index + 1}|| maxBase`,
            as: 'gradEndTemp',
          },
          {
            calculate: `datum['${numericField}'] < datum.gradEndTemp ? datum['${numericField}']: datum.gradEndTemp`,
            as: 'gradEnd',
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
  } else if (styleOptions.exclusive.displayMode === 'gradient') {
    bars = [
      {
        mark: { type: 'bar', clip: true },
        transform: [
          {
            calculate: `datum['${numericField}']>=datum.maxVal?datum.maxVal:datum['${numericField}']`,
            as: 'barEnd',
          },
          { filter: `datum['${numericField}'] >= datum.minVal` },
        ],
        encoding: {
          [`${processedSymbol}`]: {
            type: 'quantitative',
            field: 'barEnd',
          },
          [`${processedSymbol}2`]: {
            type: 'quantitative',
            field: 'minVal',
          },
          color: {
            value: {
              expr: generateTrans(processedThresholds),
            },
          },
        },
      },
    ];
  } else if (styleOptions.exclusive.displayMode === 'basic') {
    bars = [
      {
        mark: { type: 'bar', clip: true },
        transform: [
          {
            calculate: `datum['${numericField}']>=datum.maxVal?datum.maxVal:datum['${numericField}']`,
            as: 'barEnd',
          },
          { filter: `datum['${numericField}'] >= datum.minVal` },
        ],
        encoding: {
          [`${processedSymbol}`]: {
            type: 'quantitative',
            field: 'barEnd',
          },
          [`${processedSymbol}2`]: {
            type: 'quantitative',
            field: 'minVal',
          },
          color: {
            field: numericField,
            type: 'quantitative',
            scale: {
              type: 'threshold',
              //  last threshold which is just for max value capping in gradient mode
              domain: processedThresholds.map((t) => t.value),
              range: [getColors().backgroundShade, ...processedThresholds.map((t) => t.color)],
            },
            legend: null,
          },
        },
      },
    ];
  }

  layers.push(...bars);

  if (styleOptions.exclusive.valueDisplay !== 'hidden') {
    const nameLayer = {
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
        fontSize: { expr: 'min(fontFactor * 10, 100)' },
        ...(styleOptions.exclusive?.valueDisplay === 'textColor'
          ? { fill: { expr: 'fontColor' } }
          : {}),
      },
      encoding: {
        [`${processedSymbol}`]: {
          type: 'quantitative',
          field: 'maxVal',
        },
        text: {
          field: 'displayValue',
        },
        color: {
          field: numericField,
          type: 'quantitative',
          scale: {
            type: 'threshold',
            domain: allThresholds.map((t) => t.value),
            range: [getColors().backgroundShade, ...allThresholds.map((t) => t.color)],
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
    resolve: {
      scale: {
        color: 'independent',
      },
    },
  };

  return baseSpec;
};
