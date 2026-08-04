/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisColumn, DisableMode, Threshold, ValueMapping } from '../types';
import { StateTimeLineChartStyle } from './state_timeline_config';
import { getAxisConfig } from '../utils/utils';
import {
  mergeDataCore,
  convertThresholdsToValueMappings,
  groupByMergedLabel,
  createStateTimeLineSpec,
  getStateTimeLineLegendNameDomain,
} from './state_timeline_utils';
import { pipe, createBaseConfig, buildAxisConfigs, assembleSpec } from '../utils/echarts_spec';
import { LegendItem } from '../utils/legend';
import {
  convertTo2DArray,
  transform,
  map,
  pick,
  sortByTime,
  TransformFn,
} from '../utils/data_transformation';

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

const createStateTimeLineTransforms = ({
  allColumns,
  timestampField,
  groupField,
  mappingField,
  valueMappings,
  rangeMappings,
  disconnectThreshold,
  connectThreshold,
  useThresholdColor,
  useValueMappingColor,
}: {
  allColumns: string[];
  timestampField: string;
  groupField?: string;
  mappingField: string;
  valueMappings?: ValueMapping[];
  rangeMappings?: ValueMapping[];
  disconnectThreshold?: string;
  connectThreshold?: string;
  useThresholdColor?: boolean;
  useValueMappingColor?: boolean;
}): TransformFn[] => [
  map(pick(allColumns)),
  sortByTime(timestampField),
  mergeDataCore({
    timestampField,
    groupField,
    mappingField,
    valueMappings,
    rangeMappings,
    disconnectThreshold,
    connectThreshold,
    useThresholdColor,
    useValueMappingColor,
  }),
  groupByMergedLabel(convertTo2DArray()),
];

const applyTransforms = (
  data: Array<Record<string, any>>,
  transforms: TransformFn[]
): Array<Record<string, any>> => transforms.reduce((result, fn) => fn(result), data);

const getLegendNameDomain = (
  allData: Array<Record<string, any>> | undefined,
  transforms: TransformFn[]
) => (allData ? getStateTimeLineLegendNameDomain(applyTransforms(allData, transforms)) : undefined);

export const createNumericalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  allData?: Array<Record<string, any>>
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, rangeMappings, disconnectThreshold, connectThreshold } =
    normalizeConfig(styleOptions);

  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);
  const transforms = createStateTimeLineTransforms({
    allColumns,
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
  });

  const result = pipe(
    transform(...transforms),
    createBaseConfig({
      addTrigger: false,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({
      styles: styleOptions,
      groupField: yCol.column,
      legendNameDomain: getLegendNameDomain(allData, transforms),
    }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};

export const createCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: {
    [AxisRole.X]: VisColumn;
    [AxisRole.Y]: VisColumn;
    [AxisRole.COLOR]: VisColumn;
  },
  allData?: Array<Record<string, any>>
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const yCol = axisColumnMappings[AxisRole.Y];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);
  const transforms = createStateTimeLineTransforms({
    allColumns,
    timestampField: xCol.column,
    groupField: yCol.column,
    mappingField: colorCol.column,
    valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
    disconnectThreshold,
    connectThreshold,
    useThresholdColor: styleOptions.useThresholdColor,
    useValueMappingColor: !styleOptions.useThresholdColor && [...(valueMappings ?? [])].length > 0,
  });

  const result = pipe(
    transform(...transforms),
    createBaseConfig({
      addTrigger: false,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({
      styles: styleOptions,
      groupField: yCol.column,
      legendNameDomain: getLegendNameDomain(allData, transforms),
    }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};

export const createSingleCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.COLOR]: VisColumn },
  allData?: Array<Record<string, any>>
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);
  const transforms = createStateTimeLineTransforms({
    allColumns,
    timestampField: xCol.column,
    groupField: undefined,
    mappingField: colorCol.column,
    valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
    disconnectThreshold,
    connectThreshold,
    useThresholdColor: styleOptions.useThresholdColor,
    useValueMappingColor: !styleOptions.useThresholdColor && [...(valueMappings ?? [])].length > 0,
  });

  const result = pipe(
    transform(...transforms),
    createBaseConfig({
      addTrigger: false,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({
      styles: styleOptions,
      groupField: undefined,
      legendNameDomain: getLegendNameDomain(allData, transforms),
    }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};

export const createSingleNumericalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings: { [AxisRole.X]: VisColumn; [AxisRole.COLOR]: VisColumn },
  allData?: Array<Record<string, any>>
): { spec: any; legendItems: LegendItem[] } => {
  const axisConfig = getAxisConfig(styleOptions);
  const xCol = axisColumnMappings[AxisRole.X];
  const colorCol = axisColumnMappings[AxisRole.COLOR];

  const { valueMappings, rangeMappings, disconnectThreshold, connectThreshold } =
    normalizeConfig(styleOptions);
  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const allColumns = Object.values(axisColumnMappings).map((m) => m.column);
  const transforms = createStateTimeLineTransforms({
    allColumns,
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
  });

  const result = pipe(
    transform(...transforms),
    createBaseConfig({
      addTrigger: false,
      legend: { show: false },
    }),
    buildAxisConfigs,
    createStateTimeLineSpec({
      styles: styleOptions,
      groupField: undefined,
      legendNameDomain: getLegendNameDomain(allData, transforms),
    }),
    assembleSpec
  )({
    data: transformedData,
    styles: styleOptions,
    axisConfig,
    axisColumnMappings,
  });

  return { spec: result.spec, legendItems: result.legendItems ?? [] };
};
