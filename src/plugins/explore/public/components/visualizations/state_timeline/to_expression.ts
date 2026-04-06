/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, AxisRole, DisableMode, Threshold } from '../types';
import { StateTimeLineChartStyle } from './state_timeline_config';
import { getSwappedAxisRole } from '../utils/utils';
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
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styleOptions, axisColumnMappings);

  const timeField = axisConfig.xAxis?.column;
  const groupField = axisConfig.yAxis?.column;

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField2 = colorMapping?.column;

  if (!groupField || !timeField || !categoryField2)
    throw Error('Missing field config for state-timeline chart');

  const { valueMappings, rangeMappings, disconnectThreshold, connectThreshold } = normalizeConfig(
    styleOptions
  );

  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(axisColumnMappings?.x?.column),
      mergeDataCore({
        timestampField: timeField,
        groupField,
        mappingField: categoryField2,
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
      title: `${colorMapping?.name} by ${axisConfig.yAxis?.name} and ${axisConfig.xAxis?.name}`,
      addTrigger: false,
      legend: { show: styleOptions.addLegend },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({ styles: styleOptions, groupField }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return result.spec;
};

export const createCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styleOptions, axisColumnMappings);

  const timeField = axisConfig.xAxis?.column;
  const groupField = axisConfig.yAxis?.column;

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField2 = colorMapping?.column;

  if (!groupField || !timeField || !categoryField2)
    throw Error('Missing field config for state-timeline chart');

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(axisColumnMappings?.x?.column),
      mergeDataCore({
        timestampField: timeField,
        groupField,
        mappingField: categoryField2,
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
      title: `${colorMapping?.name} by ${axisConfig.yAxis?.name} and ${axisConfig.xAxis?.name}`,
      addTrigger: false,
      legend: { show: styleOptions.addLegend },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({ styles: styleOptions, groupField }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return result.spec;
};

export const createSingleCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styleOptions, axisColumnMappings);

  const timeField = axisConfig.xAxis?.column;

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField = colorMapping?.column;

  if (!timeField || !categoryField)
    throw Error('Missing field config for single state-timeline chart');

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(axisColumnMappings?.x?.column),
      mergeDataCore({
        timestampField: timeField,
        groupField: undefined,
        mappingField: categoryField,
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
      title: `${colorMapping?.name}  by ${axisConfig.xAxis?.name}`,
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
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return result.spec;
};

export const createSingleNumericalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const axisConfig = getSwappedAxisRole(styleOptions, axisColumnMappings);

  const timeField = axisConfig.xAxis?.column;

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField = colorMapping?.column;

  if (!timeField || !categoryField)
    throw Error('Missing field config for single state-timeline chart');

  const { valueMappings, rangeMappings, disconnectThreshold, connectThreshold } = normalizeConfig(
    styleOptions
  );
  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

  const result = pipe(
    transform(
      map(pick(allColumns)),
      sortByTime(axisColumnMappings?.x?.column),
      mergeDataCore({
        timestampField: timeField,
        groupField: undefined,
        mappingField: categoryField,
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
      title: `${colorMapping?.name}  by ${axisConfig.xAxis?.name}`,
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
    axisColumnMappings: axisColumnMappings ?? {},
  });

  return result.spec;
};
