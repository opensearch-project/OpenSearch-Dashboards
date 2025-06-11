/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorSchemas, LabelAggregationType, VisColumn } from '../types';
import { HeatmapChartStyleControls } from './heatmap_vis_config';

export function generateColorBySchema(schema: ColorSchemas, count: number): string[] {
  const colors: string[] = [];

  // Define RGB gradient start and end for each schema
  const colorRanges: Record<
    ColorSchemas,
    { start: [number, number, number]; end: [number, number, number] }
  > = {
    [ColorSchemas.BLUES]: { start: [173, 216, 230], end: [0, 0, 51] },
    [ColorSchemas.GREENS]: { start: [204, 255, 204], end: [0, 51, 0] },
    [ColorSchemas.GREYS]: { start: [240, 240, 240], end: [51, 51, 51] },
    [ColorSchemas.REDS]: { start: [255, 204, 204], end: [102, 0, 0] },
    [ColorSchemas.YELLOWORANGE]: { start: [255, 255, 204], end: [204, 102, 0] },
    [ColorSchemas.GREENBLUE]: { start: [204, 255, 255], end: [0, 102, 102] },
  };

  const range = colorRanges[schema];
  if (!range) return colors;

  const [startR, startG, startB] = range.start;
  const [endR, endG, endB] = range.end;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const r = Math.round(startR + (endR - startR) * t);
    const g = Math.round(startG + (endG - startG) * t);
    const b = Math.round(startB + (endB - startB) * t);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
    colors.push(hex);
  }
  return colors;
}

// isRegular=== true refers to 2 dimension and 1 metric heatmap.
export const createlabelLayer = (
  styles: HeatmapChartStyleControls,
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

export const addTransform = (
  styles: HeatmapChartStyleControls,
  numericFields: string | undefined
) => {
  if (styles.exclusive.percentageMode) {
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

export const setRange = (styles: HeatmapChartStyleControls) => {
  const ranges = styles?.exclusive?.customRanges ?? [];
  // always make sure the range lenghth >=2 to interpolate
  const colors = generateColorBySchema(styles.exclusive.colorSchema, ranges.length + 1);
  return colors;
};

export const enhanceStyle = (
  markLayer: any,
  styles: HeatmapChartStyleControls,
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
