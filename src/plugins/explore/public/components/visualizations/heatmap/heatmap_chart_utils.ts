/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LabelAggregationType, VisColumn } from '../types';
import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { generateColorBySchema } from '../utils/utils';

// isRegular=== true refers to 2 dimension and 1 metric heatmap.
export const createlabelLayer = (
  styles: Partial<HeatmapChartStyleControls>,
  isRegular: boolean,
  xAxis?: VisColumn,
  yAxis?: VisColumn,
  color?: string
) => {
  if (!styles.label?.show) {
    return null;
  }
  const textEncoding: any = {
    field: color,
    format: '.1f',
  };

  if (!isRegular && styles.label.type !== LabelAggregationType.NONE && styles.label.type) {
    textEncoding.aggregate = styles.label.type;
  }
  const labelLayer: any = {
    mark: {
      type: 'text',
      color: styles.label.overwriteColor ? styles.label.color : 'black',
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
      angle: { value: styles.label.rotate ? 45 : 0 },
    },
  };
  return labelLayer;
};

export const getDataBound = (
  transformedData: Array<Record<string, any>>,
  numericalColor: string
): number[] => {
  if (!transformedData) return [];

  const values = transformedData.map((d) => Number(d[numericalColor])).filter((v) => !isNaN(v));

  return values.length > 0 ? [Math.min(...values), Math.max(...values)] : [];
};

export const addTransform = (styles: Partial<HeatmapChartStyleControls>, numericFields: string) => {
  if (styles?.exclusive?.percentageMode) {
    return [
      {
        joinaggregate: [{ op: 'max', field: numericFields, as: 'max_value' }],
      },
      {
        calculate: `(datum["${numericFields}"] / datum.max_value)`,
        as: numericFields,
      },
    ];
  }
  return [];
};

export const setRange = (styles: Partial<HeatmapChartStyleControls>) => {
  const ranges = styles?.exclusive?.customRanges ?? [];
  // always make sure the range lenghth >=2 to interpolate
  const colors = generateColorBySchema(ranges.length + 1, styles?.exclusive?.colorSchema!);
  return colors;
};

export const enhanceStyle = (
  markLayer: any,
  styles: Partial<HeatmapChartStyleControls>,
  transformedData: Array<Record<string, any>>,
  numericalColor: string
) => {
  if (styles.exclusive?.percentageMode && styles.addLegend) {
    markLayer.encoding.color.scale.domain = [0, 1];
    markLayer.encoding.color.legend.format = '.0%';
  }

  if (
    styles.exclusive?.scaleToDataBounds &&
    getDataBound(transformedData, numericalColor).length > 0
  ) {
    markLayer.encoding.color.scale.domain = getDataBound(transformedData, numericalColor);
  }

  if (
    styles.exclusive?.useCustomRanges &&
    styles.exclusive?.customRanges?.length &&
    styles.exclusive?.customRanges?.length >= 1
  ) {
    const customRanges = styles.exclusive?.customRanges;

    const [min, max] = getDataBound(transformedData, numericalColor);

    // identify min and max to set domain
    const domainMin = Math.min(...customRanges.map((r) => r.min ?? min));
    const domainMax = Math.max(...customRanges?.map((r) => r.max ?? max));
    markLayer.encoding.color.scale.type = 'quantize';
    markLayer.encoding.color.scale.domain = [domainMin, domainMax];

    const range = setRange(styles);

    markLayer.encoding.color.scale.range = range;
  }
};
