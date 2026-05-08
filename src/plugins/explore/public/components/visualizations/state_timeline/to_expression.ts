/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisColumn, DisableMode, Threshold } from '../types';
import { StateTimeLineChartStyle } from './state_timeline_config';
import { getAxisConfig } from '../utils/utils';
import {
  mergeDataCore,
  convertThresholdsToValueMappings,
  groupByMergedLabel,
  createStateTimeLineSpec,
} from './state_timeline_utils';
import { pipe, createBaseConfig, buildAxisConfigs, assembleSpec } from '../utils/echarts_spec';
import { convertTo2DArray, transform, map, pick, sortByTime } from '../utils/data_transformation';

const normalizeConfig = (styleOptions: StateTimeLineChartStyle) => {
  const valueMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const disconnectThreshold =
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.disconnectValues?.threshold || '1h'
      : undefined;

  const connectThreshold =
    styleOptions?.exclusive?.connectNullValues?.connectMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.connectNullValues?.threshold || '1h'
      : undefined;

  return { valueMappings, rangeMappings, disconnectThreshold, connectThreshold };
};

export const createNumericalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  }
): any => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, rangeMappings, disconnectThreshold, connectThreshold } = normalizeConfig(
    styleOptions
  );

  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(xCol.column),
      mergeDataCore({
        timestampField: xCol.column,
        groupField: yCol.column,
        mappingField: colorCol.column,
        valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
        rangeMappings: styleOptions.useThresholdColor ? convertedThresholds : rangeMappings,
        disconnectThreshold,
        connectThreshold,
        useThresholdColor: styleOptions.useThresholdColor,
        useValueMappingColor:
          !styleOptions.useThresholdColor &&
          [...(valueMappings ?? []), ...(rangeMappings ?? [])].length > 0,
      }),
      groupByMergedLabel(convertTo2DArray())
    ),
    createBaseConfig({
      title: `${colorCol.name} by ${yCol.name} and ${xCol.name}`,
      addTrigger: false,
      legend: { show: styleOptions.addLegend },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({ styles: styleOptions, groupField: yCol.column }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};

export const createCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  }
): any => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(xCol.column),
      mergeDataCore({
        timestampField: xCol.column,
        groupField: yCol.column,
        mappingField: colorCol.column,
        valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
        disconnectThreshold,
        connectThreshold,
        useThresholdColor: styleOptions.useThresholdColor,
        useValueMappingColor:
          !styleOptions.useThresholdColor && [...(valueMappings ?? [])].length > 0,
      }),
      groupByMergedLabel(convertTo2DArray())
    ),
    createBaseConfig({
      title: `${colorCol.name} by ${yCol.name} and ${xCol.name}`,
      addTrigger: false,
      legend: { show: styleOptions.addLegend },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({ styles: styleOptions, groupField: yCol.column }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};

export const createSingleCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.COLOR]: VisColumn }
): any => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(xCol.column),
      mergeDataCore({
        timestampField: xCol.column,
        groupField: undefined,
        mappingField: colorCol.column,
        valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
        disconnectThreshold,
        connectThreshold,
        useThresholdColor: styleOptions.useThresholdColor,
        useValueMappingColor:
          !styleOptions.useThresholdColor && [...(valueMappings ?? [])].length > 0,
      }),
      groupByMergedLabel(convertTo2DArray())
    ),
    createBaseConfig({
      title: `${colorCol.name}  by ${xCol.name}`,
      addTrigger: false,
      legend: { show: styleOptions.addLegend },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({ styles: styleOptions, groupField: undefined }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};

export const createSingleNumericalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.COLOR]: VisColumn }
): any => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, rangeMappings, disconnectThreshold, connectThreshold } = normalizeConfig(
    styleOptions
  );
  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(xCol.column),
      mergeDataCore({
        timestampField: xCol.column,
        groupField: undefined,
        mappingField: colorCol.column,
        valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
        rangeMappings: styleOptions.useThresholdColor ? convertedThresholds : rangeMappings,
        disconnectThreshold,
        connectThreshold,
        useThresholdColor: styleOptions.useThresholdColor,
        useValueMappingColor:
          !styleOptions.useThresholdColor &&
          [...(valueMappings ?? []), ...(rangeMappings ?? [])].length > 0,
      }),
      groupByMergedLabel(convertTo2DArray())
    ),
    createBaseConfig({
      title: `${colorCol.name}  by ${xCol.name}`,
      addTrigger: false,
      legend: { show: styleOptions.addLegend },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({ styles: styleOptions, groupField: undefined }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return result.spec;
};
