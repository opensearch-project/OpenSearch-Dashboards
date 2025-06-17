/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricChartStyleControls } from './metric_vis_config';
import { VisColumn, RangeValue, ColorSchemas, VEGASCHEMA } from '../types';
import { generateColorBySchema } from '../utils/utils';

export const createSingleMetric = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<MetricChartStyleControls>
) => {
  const numericFields = numericalColumns[0].column;
  const numericNames = numericalColumns[0].name;

  function generateColorConditions(ranges: RangeValue[], color: ColorSchemas) {
    const colors = generateColorBySchema(ranges.length + 1, color);
    const conditions = [];

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];

      const minTest = `datum["${numericFields}"] >= ${r.min}`;
      const maxTest = r.max !== undefined ? ` && datum["${numericFields}"] < ${r.max}` : '';

      conditions.push({
        test: minTest + maxTest,
        value: colors[i] || colors[colors.length - 1], // fallback color if not enough
      });
    }
    const last = ranges[ranges.length - 1];
    if (last.max) {
      conditions.push({
        test: `datum["${numericFields}"] >= ${last.max}`,
        value: colors[colors.length - 1],
      });
    }

    return conditions;
  }

  const markLayer: any = {
    mark: {
      type: 'text',
      align: 'center',
      fontSize: styleOptions?.fontSize,
      fontWeight: 'bold',
    },
    encoding: {
      text: {
        field: numericFields,
        type: 'quantitative',
      },
    },
  };

  const titleLayer = {
    mark: {
      type: 'text',
      align: 'center',
      dy: 50,
      fontSize: 16,
      fontWeight: 'bold',
    },
    encoding: {
      text: {
        value: styleOptions?.title || numericNames,
      },
    },
  };

  if (styleOptions?.useColor && styleOptions.customRanges && styleOptions.customRanges.length > 0) {
    markLayer.encoding.color = {};
    markLayer.encoding.color.condition = generateColorConditions(
      styleOptions.customRanges,
      styleOptions.colorSchema!
    );
  }

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: transformedData },
    layer: [markLayer, styleOptions?.showTitle ? titleLayer : null].filter(Boolean),
  };

  return baseSpec;
};
