/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricChartStyle } from './metric_vis_config';
import { VisColumn, VEGASCHEMA, AxisRole, AxisColumnMappings, Threshold } from '../types';
import { getTooltipFormat } from '../utils/utils';
import { calculatePercentage, calculateValue } from '../utils/calculation';
import { getColors } from '../theme/default_colors';
import { DEFAULT_OPACITY } from '../constants';
import { getUnitById, showDisplayValue } from '../style_panel/unit/collection';
import {
  mergeThresholdsWithBase,
  getMaxAndMinBase,
} from '../style_panel/threshold/threshold_utils';

export const createSingleMetric = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: MetricChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const colorPalette = getColors();
  // const styles: MetricChartStyle = { ...defaultMetricChartStyles, ...styleOptions };
  // Only contains one and the only one value
  const valueColumn = axisColumnMappings?.[AxisRole.Value];
  const numericField = valueColumn?.column;
  const numericFieldName = valueColumn?.name;

  const dateColumn = axisColumnMappings?.[AxisRole.Time];
  const dateField = dateColumn?.column;
  const dateFieldName = dateColumn?.name;

  const valueFontSize = styles.fontSize;
  const titleSize = styles.titleSize;
  const percentageSize = styles.percentageSize;

  let numericalValues: number[] = [];
  let maxNumber: number = 0;
  let minNumber: number = 0;
  if (numericField) {
    numericalValues = transformedData.map((d) => d[numericField]);
    maxNumber = Math.max(...numericalValues);
    minNumber = Math.min(...numericalValues);
  }

  const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
  const isValidNumber =
    calculatedValue !== undefined && typeof calculatedValue === 'number' && !isNaN(calculatedValue);

  const selectedUnit = getUnitById(styles?.unitId);

  const displayValue = showDisplayValue(isValidNumber, selectedUnit, calculatedValue);

  const { minBase, maxBase } = getMaxAndMinBase(
    minNumber,
    maxNumber,
    styles?.min,
    styles?.max,
    calculatedValue
  );

  const targetValue = calculatedValue ?? 0;

  function targetFillColor(
    useThresholdColor: boolean,
    threshold?: Threshold[],
    baseColor?: string
  ) {
    const newThreshold = threshold ?? [];

    const newBaseColor = baseColor ?? getColors().statusGreen;

    const { textColor, mergedThresholds } = mergeThresholdsWithBase(
      minBase,
      maxBase,
      newBaseColor,
      newThreshold,
      calculatedValue
    );

    const fillColor = useThresholdColor ? textColor : colorPalette.text;

    return fillColor;
  }

  const fillColor = targetFillColor(
    styles?.useThresholdColor ?? false,
    styles?.thresholdOptions?.thresholds,
    styles?.thresholdOptions?.baseColor
  );

  const layer = [];
  if (dateField) {
    const sparkLineLayer = {
      data: {
        values: transformedData,
      },
      mark: {
        type: 'area',
        opacity: DEFAULT_OPACITY,
        color: colorPalette.categories[0],
      },
      encoding: {
        x: {
          field: dateField,
          type: 'temporal',
          axis: null,
        },
        y: {
          field: numericField,
          type: 'quantitative',
          axis: null,
          scale: { range: [{ expr: 'height' }, { expr: '2*height/3' }] },
        },
        tooltip: [
          {
            field: dateField,
            type: 'temporal',
            title: dateFieldName,
            format: getTooltipFormat(transformedData, dateField),
          },
          { field: numericField, type: 'quantitative', title: numericFieldName },
        ],
      },
    };
    layer.push(sparkLineLayer);
  }

  const markLayer: any = {
    data: {
      values: [{ value: displayValue ?? '-' }],
    },
    mark: {
      type: 'text',
      align: 'center',
      baseline: 'middle',
      fontSize: valueFontSize
        ? valueFontSize
        : { expr: `5*textSize * ${selectedUnit?.fontScale ?? 1}` },
      dy: valueFontSize
        ? -valueFontSize / 8
        : { expr: `-textSize* ${selectedUnit?.fontScale ?? 1}` },
      color: fillColor,
    },
    encoding: {
      text: {
        field: 'value',
        type: 'nominal',
      },
    },
  };
  layer.push(markLayer);

  if (styles.showTitle) {
    const titleLayer = {
      data: {
        values: [{ title: styles.title || numericFieldName }],
      },
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'bottom',
        dy: valueFontSize ? -valueFontSize : { expr: '-5.5*textSize' },
        fontSize: titleSize ? titleSize : { expr: '1.5*textSize' },
        color: colorPalette.text,
      },
      encoding: {
        text: {
          field: 'title',
        },
      },
    };
    layer.push(titleLayer);
  }

  if (styles.showPercentage) {
    const percentage = calculatePercentage(numericalValues);

    let color = colorPalette.text;
    if (percentage !== undefined && percentage > 0) {
      if (styles.percentageColor === 'standard') {
        color = colorPalette.statusGreen;
      } else if (styles.percentageColor === 'inverted') {
        color = colorPalette.statusRed;
      } else {
        color = colorPalette.statusGreen;
      }
    }
    if (percentage !== undefined && percentage < 0) {
      if (styles.percentageColor === 'standard') {
        color = colorPalette.statusRed;
      } else if (styles.percentageColor === 'inverted') {
        color = colorPalette.statusGreen;
      } else {
        color = colorPalette.statusRed;
      }
    }

    const percentageLayer = {
      data: {
        values: [{ value: percentage ?? '-' }],
      },
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'top',
        dy: valueFontSize ? valueFontSize / 2 : { expr: '2.5*textSize' },
        fontSize: percentageSize ? percentageSize : { expr: '2*textSize' },
        color,
      },
      encoding: {
        text: {
          field: 'value',
          type: percentage !== undefined ? 'quantitative' : 'nominal',
          format: percentage !== undefined ? '+,.2%' : null,
        },
      },
    };
    layer.push(percentageLayer);
  }

  const baseSpec = {
    $schema: VEGASCHEMA,
    params: [{ name: 'textSize', expr: 'min(width, height) / 20' }],
    layer,
  };

  return baseSpec;
};
