/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Encoding } from 'vega-lite/build/src/encoding';
import { AggregationType, VisColumn, ColorSchemas } from '../types';
import { HeatmapChartStyle } from './heatmap_vis_config';

import { getColors, DEFAULT_GREY } from '../theme/default_colors';

// isRegular=== true refers to 2 dimension and 1 metric heatmap.
export const createLabelLayer = (
  styles: HeatmapChartStyle,
  isRegular: boolean,
  colorField: string,
  xAxis?: VisColumn,
  yAxis?: VisColumn
) => {
  if (!styles.exclusive?.label?.show) {
    return null;
  }
  const textEncoding: Encoding<string>['text'] = {
    field: colorField,
    format: '.1f',
  };

  // For heatmaps with binned x and y axes, aggregation on the label is typically applied to avoid overlapping marks,
  // as multiple data points may fall into the same bin.

  if (
    !isRegular &&
    styles.exclusive?.label.type !== AggregationType.NONE &&
    styles.exclusive?.label.type
  ) {
    textEncoding.aggregate = styles.exclusive?.label.type;
  }
  const labelLayer = {
    mark: {
      type: 'text',
      color: styles.exclusive?.label.overwriteColor ? styles.exclusive?.label.color : 'black',
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: isRegular ? 'nominal' : 'quantitative',
        bin: !isRegular ? true : false,
      },
      y: {
        field: yAxis?.column,
        type: isRegular ? 'nominal' : 'quantitative',
        bin: !isRegular ? true : false,
      },
      text: textEncoding,
      angle: { value: styles.exclusive?.label.rotate ? 45 : 0 },
    },
  };
  return labelLayer;
};

export const getDataBound = (
  transformedData: Array<Record<string, any>>,
  colorField: string
): number[] => {
  const values = transformedData.map((d) => Number(d[colorField])).filter((v) => !isNaN(v));

  return values.length > 0 ? [Math.min(...values), Math.max(...values)] : [];
};

export const addTransform = (styles: HeatmapChartStyle, numericFields: string) => {
  if (styles?.exclusive?.percentageMode) {
    return [
      {
        joinaggregate: [{ op: 'max', field: numericFields, as: 'max_value' }],
      },
      {
        calculate: `(datum.max_value === 0 ? datum["${numericFields}"] : datum["${numericFields}"] / datum.max_value)`,
        as: numericFields,
      },
    ];
  }
  return [];
};

export const enhanceStyle = (
  markLayer: any,
  styles: HeatmapChartStyle,
  transformedData: Array<Record<string, any>>,
  colorField: string
) => {
  // In percentageMode, set domain to [0, 1] and apply a transform layer to the percentage value.
  if (styles.exclusive?.percentageMode && styles.addLegend) {
    markLayer.encoding.color.scale.domain = [0, 1];
    markLayer.encoding.color.legend.format = '.0%';
  }

  // for scaleToDataBounds, simply set the domain to [min, max]
  if (styles.exclusive?.scaleToDataBounds && getDataBound(transformedData, colorField).length > 0) {
    markLayer.encoding.color.scale.domain = getDataBound(transformedData, colorField);
  }

  if (styles?.useThresholdColor && styles.thresholdOptions?.thresholds) {
    const newThreshold = styles?.thresholdOptions?.thresholds ?? [];

    const thresholdWithBase = [
      { value: 0, color: styles?.thresholdOptions?.baseColor ?? getColors().statusGreen },
      ...newThreshold,
    ];

    const colorDomain = thresholdWithBase.map<number>((val) => val.value);
    const colorRange = thresholdWithBase.map<string>((val) => val.color);

    // overwrite color scale type to quantize to map continuous domains to discrete output ranges
    markLayer.encoding.color.scale.type = 'threshold';
    markLayer.encoding.color.scale.domain = colorDomain;
    // require one more color for values below the first threshold(base)
    markLayer.encoding.color.scale.range = [DEFAULT_GREY, ...colorRange];
  }
};

export function generateSchemeList(targetHex: string, n = 11, step = 20) {
  function hexToRgb(hex: string) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
    return (
      '#' +
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0')
    );
  }

  const half = Math.floor(n / 2);
  const target = hexToRgb(targetHex);
  const colors = [];

  // Left side (lighter)
  for (let i = half; i > 0; i--) {
    colors.push(
      rgbToHex({
        r: Math.min(255, target.r + i * step),
        g: Math.min(255, target.g + i * step),
        b: Math.min(255, target.b + i * step),
      })
    );
  }

  // Center
  colors.push(rgbToHex(target));

  // Right side (darker)
  for (let i = 1; i <= half; i++) {
    colors.push(
      rgbToHex({
        r: Math.max(0, target.r - i * step),
        g: Math.max(0, target.g - i * step),
        b: Math.max(0, target.b - i * step),
      })
    );
  }
  return colors;
}

export const getColorRange = (colorSchema: ColorSchemas) => {
  switch (colorSchema) {
    case ColorSchemas.BLUES:
      return generateSchemeList(getColors().categories[0]);
    case ColorSchemas.PURPLES:
      return generateSchemeList(getColors().categories[1]);
    case ColorSchemas.ORANGES:
      return generateSchemeList(getColors().categories[2]);
    case ColorSchemas.YELLOWS:
      return generateSchemeList(getColors().categories[3]);
    case ColorSchemas.GREENS:
      return generateSchemeList(getColors().categories[5]);
    case ColorSchemas.REDS:
      return generateSchemeList(getColors().categories[6]);
    default:
      return undefined;
  }
};
