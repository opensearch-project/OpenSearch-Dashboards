/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, VisColumn, VisFieldType, ThresholdMode } from './types';
import { StyleOptions } from './utils/use_visualization_types';
import { ChartConfig } from './visualization_builder.types';
import {
  Colors,
  transformThresholdLinesToThreshold,
  transformToThreshold,
} from './style_panel/threshold/threshold_utils';
import { getColors } from './theme/default_colors';
import { MetricChartStyleOptions } from './metric/metric_vis_config';
import { BarChartStyleOptions } from './bar/bar_vis_config';
import { AreaChartStyleOptions } from './area/area_vis_config';
import { LineChartStyleOptions } from './line/line_vis_config';
import { GaugeChartStyleOptions } from './gauge/gauge_vis_config';
import { HeatmapChartStyleOptions } from './heatmap/heatmap_vis_config';

export const convertMappingsToStrings = (mappings: AxisColumnMappings): Record<string, string> =>
  Object.fromEntries(Object.entries(mappings).map(([axis, column]) => [axis, column?.name]));

export const convertStringsToMappings = (
  stringMappings: Partial<Record<string, string>>,
  allColumns: VisColumn[]
): AxisColumnMappings =>
  Object.fromEntries(
    Object.entries(stringMappings).map(([axis, columnName]) => [
      axis,
      allColumns.find((col) => col.name === columnName),
    ])
  );

export const isValidMapping = (
  selectedAxesMapping: Partial<Record<string, string>>,
  allColumns: VisColumn[]
) =>
  Object.values(selectedAxesMapping).every((columnName) =>
    allColumns.some((col) => col.name === columnName)
  );

export const getColumnsByAxesMapping = (
  selectedAxesMapping: Partial<Record<string, string>>,
  allColumns: VisColumn[]
) => {
  const numericalColumns: VisColumn[] = [];
  const categoricalColumns: VisColumn[] = [];
  const dateColumns: VisColumn[] = [];
  Object.values(selectedAxesMapping).forEach((fieldName) => {
    const column = allColumns.find((c) => c.name === fieldName);
    if (column?.schema === VisFieldType.Numerical) {
      numericalColumns.push(column);
    }
    if (column?.schema === VisFieldType.Categorical) {
      categoricalColumns.push(column);
    }
    if (column?.schema === VisFieldType.Date) {
      dateColumns.push(column);
    }
  });
  return { numericalColumns, categoricalColumns, dateColumns };
};

export const getColumnMatchFromMapping = (
  mapping: Record<string, { type: VisFieldType; index: number }>
): number[] => {
  const counts = {
    [VisFieldType.Numerical]: 0,
    [VisFieldType.Categorical]: 0,
    [VisFieldType.Date]: 0,
    [VisFieldType.Unknown]: 0,
  };
  Object.values(mapping).forEach(({ type }) => {
    if (type in counts) counts[type]++;
  });
  return [
    counts[VisFieldType.Numerical],
    counts[VisFieldType.Categorical],
    counts[VisFieldType.Date],
  ];
};

export const adaptLegacyData = (config?: ChartConfig) => {
  if (!config) {
    return config;
  }

  let transformedConfig = { ...config };

  // only transform data when user saved old custom ranges config or threshold-lines config
  // and once user makes some updates on threshold, will only focus on threshold
  if (transformedConfig.type === 'metric') {
    const styles = transformedConfig.styles as MetricChartStyleOptions | undefined;
    const { customRanges, colorSchema, thresholdOptions } = styles || {};
    if (colorSchema && !thresholdOptions) {
      const thresholds = transformToThreshold(colorSchema, customRanges);
      const baseColor = Colors[colorSchema].baseColor;
      const useThresholdColor = styles?.useColor ?? false;

      transformedConfig = {
        ...transformedConfig,
        styles: {
          ...transformedConfig.styles,
          useThresholdColor,
          thresholdOptions: { baseColor, thresholds },
        } as StyleOptions,
      };
    }
  }

  if (transformedConfig.type === 'heatmap') {
    const styles = transformedConfig.styles as HeatmapChartStyleOptions | undefined;
    const { exclusive, thresholdOptions } = styles || {};
    // customRanges can be undefined in old config, and will perform the adoption in transformToThreshold
    if (exclusive?.colorSchema && !thresholdOptions) {
      const thresholds = transformToThreshold(exclusive.colorSchema, exclusive.customRanges);
      const baseColor = Colors[exclusive?.colorSchema].baseColor;
      const useThresholdColor = exclusive?.useCustomRanges ?? false;

      transformedConfig = {
        ...transformedConfig,
        styles: {
          ...transformedConfig.styles,
          useThresholdColor,
          thresholdOptions: { baseColor, thresholds },
        } as StyleOptions,
      };
    }
  }
  if (
    transformedConfig.type === 'bar' ||
    transformedConfig.type === 'line' ||
    transformedConfig.type === 'area'
  ) {
    const styles = config.styles as
      | BarChartStyleOptions
      | LineChartStyleOptions
      | AreaChartStyleOptions
      | undefined;
    const { thresholdOptions, thresholdLines } = styles || {};
    if (thresholdLines && !thresholdOptions) {
      const thresholds = transformThresholdLinesToThreshold(thresholdLines);
      const baseColor = getColors().statusGreen;
      const thresholdStyle = thresholdLines[0].show
        ? thresholdLines[0].style || ThresholdMode.Solid
        : ThresholdMode.Off;

      transformedConfig = {
        ...transformedConfig,
        styles: {
          ...transformedConfig.styles,
          useThresholdColor: false,
          thresholdOptions: {
            thresholds,
            baseColor,
            thresholdStyle,
          },
        } as StyleOptions,
      };
    }
  }
  if (transformedConfig.type === 'gauge') {
    const styles = config.styles as GaugeChartStyleOptions | undefined;
    const { thresholdOptions, thresholds, baseColor } = styles || {};

    if (!thresholdOptions) {
      transformedConfig = {
        ...transformedConfig,
        styles: {
          ...transformedConfig.styles,
          useThresholdColor: false,
          thresholdOptions: {
            thresholds,
            baseColor,
          },
        } as StyleOptions,
      };
    }
  }

  return transformedConfig;
};
