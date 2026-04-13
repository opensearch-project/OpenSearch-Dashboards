/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import DOMPurify from 'dompurify';
import { HeatmapSeriesOption } from 'echarts';
// @ts-expect-error TS2307 TODO(ts-error): fixme
import type { Encoding } from 'vega-lite/build/src/encoding';
import { AggregationType, VisColumn, Positions, ColorSchemas, ScaleType } from '../types';
import { HeatmapChartStyle } from './heatmap_vis_config';
import { getColors, DEFAULT_GREY } from '../theme/default_colors';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { rgbToHex, hexToRgb } from '../theme/color_utils';
import { getSeriesDisplayName } from '../utils/series';

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

// Uses Interquartile Range method to find robust min/max values by excluding statistical outliers
// 1.5 × IQR rule is a common method to identify outliers in a dataset
const inferMinMaxByIQR = (values: number[]) => {
  // Sort values to calculate quartiles
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;

  // Calculate first quartile (25th percentile) and third quartile (75th percentile)
  const q1 = sorted[Math.floor(len * 0.25)];
  const q3 = sorted[Math.floor(len * 0.75)];
  const iqr = q3 - q1;

  // outlier detection: values beyond 1.5 * IQR from quartiles are outliers
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return {
    min: lowerBound,
    max: upperBound,
  };
};

const buildVisualMap = (visualMap: any, styles: HeatmapChartStyle, numericalValues: number[]) => {
  const colorRange = getColorRange(
    styles.exclusive.colorSchema,
    styles.exclusive.maxNumberOfColors ?? 11,
    styles.exclusive.reverseSchema
  );

  // heatmap use visualMap as legend
  // TODO a dynamic way to place legend
  const baseStyle = {
    show: styles.addLegend,
    orient: [Positions.LEFT, Positions.RIGHT].includes(styles?.legendPosition)
      ? 'vertical'
      : 'horizontal',
    ...([Positions.BOTTOM, Positions.TOP].includes(styles?.legendPosition) && { left: 'center' }),
    [String(styles?.legendPosition ?? Positions.BOTTOM)]: 1,
    inRange: {
      color: colorRange,
    },
  };

  if (styles.useThresholdColor) {
    return visualMap.map((vm: any) => ({ ...vm, ...baseStyle }));
  }

  const { min, max } = styles.exclusive.percentageMode
    ? { min: 0, max: 1 }
    : styles.exclusive.scaleToDataBounds
    ? { min: Math.min(...numericalValues), max: Math.max(...numericalValues) }
    : inferMinMaxByIQR(numericalValues);

  return { min, max, ...baseStyle };
};

export const createHeatmapSeries = <T extends BaseChartStyle>({
  styles,
  categoryFields,
  seriesField,
}: {
  styles: HeatmapChartStyle;
  categoryFields: string[];
  seriesField: string;
}): PipelineFn<T> => (state) => {
  const { transformedData = [], visualMap, axisColumnMappings } = state;

  const seriesIndex = transformedData[0].indexOf(seriesField);

  if (seriesIndex < 0) {
    throw new Error(`Series field not found in transformed data: ${seriesField}`);
  }

  const newState = { ...state };

  const numericalValues: number[] = [];

  const logSource = (rawSource: any[]) =>
    rawSource.map((row, i) => {
      if (i === 0) return row;
      const newRow = [...row];

      const v = Number(newRow[seriesIndex] ?? 0);
      newRow[seriesIndex] = v > 0 ? Math.log10(v) : null; // ensure mathematically correct

      return newRow;
    });

  const sqrtSource = (rawSource: any[]) =>
    rawSource.map((row, i) => {
      if (i === 0) return row;
      const newRow = [...row];
      const v = newRow[seriesIndex];
      newRow[seriesIndex] = v != null && v >= 0 ? Math.sqrt(Number(v)) : null; // invalid result will not be shown in charts
      return newRow;
    });

  let newTransformedData: Array<Array<string | number | null>> = [...transformedData];
  if (styles.exclusive.colorScaleType === ScaleType.LOG) {
    newTransformedData = logSource(transformedData);
  } else if (styles.exclusive.colorScaleType === ScaleType.SQRT) {
    newTransformedData = sqrtSource(transformedData);
  }

  if (styles.exclusive.percentageMode) {
    const maxValue = Math.max(
      ...newTransformedData
        .slice(1)
        .filter((row) => row[seriesIndex] !== null)
        .map((row) => Number(row[seriesIndex]))
    );
    newTransformedData = [...newTransformedData].map((row, i) => {
      if (i === 0) return row;
      const newRow = [...row];
      newRow[seriesIndex] =
        maxValue === 0 || row[seriesIndex] === null
          ? row[seriesIndex]
          : Number(row[seriesIndex]) / maxValue;
      return newRow;
    });
  }

  for (let i = 1; i < newTransformedData.length; i++) {
    if (newTransformedData[i][seriesIndex] !== null)
      numericalValues.push(Number(newTransformedData[i][seriesIndex])); // numericalValues is used for building visual map
  }

  const series: HeatmapSeriesOption[] = [
    {
      type: 'heatmap',
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
        },
      },
      animation: false,
      label: {
        show: styles.exclusive.label.show,
        ...(styles.exclusive.label.overwriteColor && {
          color: styles.exclusive.label.color ?? 'white',
        }),
        ...(styles.exclusive.label.rotate && { rotate: 45 }),
        formatter: (params: any) => {
          const v = Array.isArray(params.value) ? params.value[seriesIndex] : params.value;
          return typeof v === 'number' ? v.toFixed(2) : v; // trim to 2 decimals
        },
      },
      tooltip: {
        formatter: (params) => {
          if (!params.value || !Array.isArray(params.value)) {
            return '';
          }

          const seriesDisplayName = getSeriesDisplayName(
            seriesField,
            Object.values(axisColumnMappings)
          );

          const categoryDisplayName = getSeriesDisplayName(
            categoryFields[0],
            Object.values(axisColumnMappings)
          );

          const categoryDisplayName2 = getSeriesDisplayName(
            categoryFields[1],
            Object.values(axisColumnMappings)
          );

          const categoryIndex = transformedData[0].indexOf(categoryFields[0]);
          const category2Index = transformedData[0].indexOf(categoryFields[1]);

          const message = `<strong>${categoryDisplayName}</strong>: ${
            params.value[categoryIndex] ?? ''
          }<br/><strong>${categoryDisplayName2}</strong>: ${
            params.value[category2Index] ?? ''
          }<br/><strong>${seriesDisplayName}</strong>: ${params.value[seriesIndex] ?? ''}`;

          return DOMPurify.sanitize(message);
        },
      },
      itemStyle: {
        borderWidth: 0.5,
        borderColor: DEFAULT_GREY,
      },
      encode: {
        x: categoryFields[0],
        y: categoryFields[1],
        tooltip: [...categoryFields, seriesField],
      },
    },
  ];

  newState.visualMap = buildVisualMap(visualMap, styles, numericalValues);
  newState.transformedData = newTransformedData;
  newState.series = series as HeatmapSeriesOption[];

  return newState;
};

function generateGradientScheme(startHex: string, endHex: string, n: number) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  const colors = [];

  for (let i = 0; i < n; i++) {
    const ratio = i / (n - 1);
    colors.push(
      rgbToHex(
        Math.round(start.r + (end.r - start.r) * ratio),
        Math.round(start.g + (end.g - start.g) * ratio),
        Math.round(start.b + (end.b - start.b) * ratio)
      )
    );
  }
  return colors;
}

export function generateSchemeList(targetHex: string, n = 11, step = 20) {
  const target = hexToRgb(targetHex);
  const colors = [];
  const isOdd = n % 2 === 1;
  const half = Math.floor(n / 2);

  // Left side (lighter)
  for (let i = half; i > 0; i--) {
    colors.push(
      rgbToHex(
        Math.min(255, target.r + i * step),
        Math.min(255, target.g + i * step),
        Math.min(255, target.b + i * step)
      )
    );
  }

  // Center (only for odd numbers)
  if (isOdd) {
    colors.push(rgbToHex(target.r, target.g, target.b));
  }

  // Right side (darker)
  for (let i = 1; i <= half; i++) {
    colors.push(
      rgbToHex(
        Math.max(0, target.r - i * step),
        Math.max(0, target.g - i * step),
        Math.max(0, target.b - i * step)
      )
    );
  }
  return colors;
}

export const getColorRange = (
  colorSchema: ColorSchemas,
  maxNumberOfColors: number,
  reverseSchema?: boolean
) => {
  let colors;
  switch (colorSchema) {
    case ColorSchemas.BLUES:
      colors = generateSchemeList(getColors().statusBlue, maxNumberOfColors);
      break;
    case ColorSchemas.GREENS:
      colors = generateSchemeList(getColors().statusGreen, maxNumberOfColors);
      break;
    case ColorSchemas.REDS:
      colors = generateSchemeList(getColors().statusRed, maxNumberOfColors);
      break;
    case ColorSchemas.GREYS:
      colors = generateSchemeList(DEFAULT_GREY, maxNumberOfColors);
      break;
    case ColorSchemas.YELLOWORANGE:
      colors = generateGradientScheme(
        getColors().statusYellow,
        getColors().statusOrange,
        maxNumberOfColors
      );
      break;
    case ColorSchemas.GREENBLUE:
      colors = generateGradientScheme(
        getColors().statusGreen,
        getColors().statusBlue,
        maxNumberOfColors
      );
      break;
    default:
      colors = generateSchemeList(getColors().statusBlue, maxNumberOfColors);
  }
  return reverseSchema ? colors.reverse() : colors;
};
