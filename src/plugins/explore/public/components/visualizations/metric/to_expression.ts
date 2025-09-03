/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultMetricChartStyleControls,
  defaultMetricChartStyles,
  MetricChartStyleControls,
} from './metric_vis_config';
import {
  VisColumn,
  RangeValue,
  ColorSchemas,
  VEGASCHEMA,
  AxisRole,
  AxisColumnMappings,
} from '../types';
import { generateColorBySchema, getTooltipFormat } from '../utils/utils';
import { calculatePercentage, calculateValue } from '../utils/calculation';
import { getColors } from '../theme/color_palettes';

export const createSingleMetric = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<MetricChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  const colorPalette = getColors();
  const styles: DefaultMetricChartStyleControls = { ...defaultMetricChartStyles, ...styleOptions };
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
  if (numericField) {
    numericalValues = transformedData.map((d) => d[numericField]);
  }

  const calculatedValue = calculateValue(numericalValues, styles.valueCalculation);
  const isValidNumber =
    calculatedValue !== undefined && typeof calculatedValue === 'number' && !isNaN(calculatedValue);

  function generateColorConditions(field: string, ranges: RangeValue[], color: ColorSchemas) {
    const colors = generateColorBySchema(ranges.length + 1, color);
    const conditions = [];

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];

      const minTest = `datum["${field}"] >= ${r.min}`;
      const maxTest = r.max !== undefined ? ` && datum["${field}"] < ${r.max}` : '';

      conditions.push({
        test: minTest + maxTest,
        value: colors[i] || colors[colors.length - 1], // fallback color if not enough
      });
    }
    const last = ranges[ranges.length - 1];
    if (last.max) {
      conditions.push({
        test: `datum["${field}"] >= ${last.max}`,
        value: colors[colors.length - 1],
      });
    }

    return conditions;
  }

  const layer = [];
  if (dateField) {
    const sparkLineLayer = {
      data: {
        values: transformedData,
      },
      mark: {
        type: 'area',
        opacity: 0.3,
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
      values: [{ value: calculatedValue ?? '-' }],
    },
    transform: [
      {
        calculate: "format(datum.value, '.2f')",
        as: 'formattedValue',
      },
    ],
    mark: {
      type: 'text',
      align: 'center',
      baseline: 'middle',
      fontSize: valueFontSize ? valueFontSize : { expr: '8*textSize' },
      dy: valueFontSize ? -valueFontSize / 8 : { expr: '-textSize' },
      color: colorPalette.text,
    },
    encoding: {
      text: {
        field: isValidNumber ? 'formattedValue' : 'value',
        type: isValidNumber ? 'quantitative' : 'nominal',
      },
    },
  };
  layer.push(markLayer);

  if (styles.useColor && styles.customRanges && styles.customRanges.length > 0) {
    markLayer.encoding.color = {};
    markLayer.encoding.color.condition = generateColorConditions(
      'formattedValue',
      styles.customRanges,
      styles.colorSchema
    );
  }

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
      if (styleOptions.percentageColor === 'standard') {
        color = colorPalette.statusGreen;
      } else if (styleOptions.percentageColor === 'inverted') {
        color = colorPalette.statusRed;
      } else {
        color = colorPalette.statusGreen;
      }
    }
    if (percentage !== undefined && percentage < 0) {
      if (styleOptions.percentageColor === 'standard') {
        color = colorPalette.statusRed;
      } else if (styleOptions.percentageColor === 'inverted') {
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
    config: {
      view: {
        stroke: null,
      },
    },
  };

  return baseSpec;
};
