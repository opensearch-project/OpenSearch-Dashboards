/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricChartStyleControls } from './metric_vis_config';
import {
  VisColumn,
  RangeValue,
  ColorSchemas,
  VEGASCHEMA,
  AxisRole,
  AxisColumnMappings,
} from '../types';
import { generateColorBySchema, calculateValue } from '../utils/utils';

export const createSingleMetric = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<MetricChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  // Only contains one and the only one value
  const valueColumn = axisColumnMappings?.[AxisRole.Value];
  const numericField = valueColumn?.column;
  const numericFieldName = valueColumn?.name;

  const dateColumn = axisColumnMappings?.[AxisRole.Time];
  const dateField = dateColumn?.column;

  const valueFontSize = styleOptions.fontSize;
  const titleSize = styleOptions.titleSize;

  let numericalValues: number[] = [];
  if (numericField) {
    numericalValues = transformedData
      .map((d) => Number(d[numericField]))
      .filter((n) => !Number.isNaN(n));
  }

  const calculatedValue = calculateValue(numericalValues, styleOptions.valueCalculation);

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
        line: { size: 1 },
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
      },
    };
    layer.push(sparkLineLayer);
  }

  const markLayer: any = {
    data: {
      values: [{ value: calculatedValue }],
    },
    transform: [
      {
        calculate: "datum.value % 1 === 0 ? datum.value : format(datum.value, '.2f')",
        as: 'formattedValue',
      },
    ],
    mark: {
      type: 'text',
      align: 'center',
      fontSize: valueFontSize ? valueFontSize : { expr: '8*textSize' },
      dy: valueFontSize ? -valueFontSize / 2 : { expr: '-3*textSize' },
      fontWeight: 'bold',
    },
    encoding: {
      text: {
        field: 'formattedValue',
        type: 'quantitative',
      },
    },
  };
  layer.push(markLayer);

  const titleLayer = {
    data: {
      values: [{ title: styleOptions?.title || numericFieldName }],
    },
    mark: {
      type: 'text',
      align: 'center',
      dy: valueFontSize ? 10 : { expr: 'textSize' },
      fontSize: titleSize ? titleSize : { expr: '2*textSize' },
      fontWeight: 'bold',
    },
    encoding: {
      text: {
        field: 'title',
      },
    },
  };

  if (styleOptions?.useColor && styleOptions.customRanges && styleOptions.customRanges.length > 0) {
    markLayer.encoding.color = {};
    markLayer.encoding.color.condition = generateColorConditions(
      'formattedValue',
      styleOptions.customRanges,
      styleOptions.colorSchema!
    );
  }

  if (styleOptions.showTitle) {
    layer.push(titleLayer);
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
