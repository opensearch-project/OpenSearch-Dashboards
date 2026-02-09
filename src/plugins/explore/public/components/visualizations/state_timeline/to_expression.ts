/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AxisColumnMappings,
  AxisRole,
  DisableMode,
  VEGASCHEMA,
  VisColumn,
  Threshold,
} from '../types';
import { StateTimeLineChartStyle } from './state_timeline_config';
import { applyAxisStyling, getSwappedAxisRole, getChartRender } from '../utils/utils';
import {
  mergeDataCore,
  convertThresholdsToValueMappings,
  groupByMergedLabel,
  createStateTimeLineSpec,
} from './state_timeline_utils';
import { DEFAULT_OPACITY } from '../constants';
import { getCategoryNextColor } from '../theme/color_utils';
import { resolveColor } from '../theme/color_utils';
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
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
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
          // TODO: Replace useValueMappingColor and useThresholdColor with Color mode option to make a switch between No style, Use Value Mapping Color, Use Threshold Color
          // Current rule: If value mappings exist, use them regardless of match; unmatched values render as light_grey with label "_unmatched_"
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
  }

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(
    styleOptions,
    axisColumnMappings
  );

  const rangeFieldColumn = axisColumnMappings?.color as any;
  const rangeField = rangeFieldColumn?.column;

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const valueMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const disconnectThreshold =
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.disconnectValues?.threshold || '1h'
      : undefined;

  const connectThreshold =
    styleOptions?.exclusive?.connectNullValues?.connectMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.connectNullValues?.threshold || '1h'
      : undefined;

  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const useValueMappingColor =
    !styleOptions.useThresholdColor &&
    [...(valueMappings ?? []), ...(rangeMappings ?? [])].length > 0;

  const processedData = mergeDataCore({
    timestampField: xAxis?.column,
    groupField: yAxis?.column,
    mappingField: rangeField,
    valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
    rangeMappings: styleOptions.useThresholdColor ? convertedThresholds : rangeMappings,
    disconnectThreshold,
    connectThreshold,
    useThresholdColor: styleOptions.useThresholdColor,
    useValueMappingColor,
  })(transformedData);

  const canUseValueMapping = useValueMappingColor || styleOptions.useThresholdColor;

  const validMappings = styleOptions.useThresholdColor
    ? convertedThresholds
    : [...(valueMappings ?? []), ...(rangeMappings ?? [])];

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const barLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'rect',
      tooltip: styleOptions.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      y: {
        field: yAxis?.column,
        type: 'nominal',
        scale: { padding: rowHeight },
        axis: {
          ...applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle, disableGrid: true }),
          tickOpacity: 0,
        },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        timeUnit: 'yearmonthdatehoursminutesseconds',
        axis: {
          ...applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle, disableGrid: true }),
          tickOpacity: 0,
        },
      },
      x2: { field: 'end', type: 'temporal' },
      color: {
        field: canUseValueMapping ? 'mergedLabel' : rangeField,
        type: 'nominal',
        legend: styleOptions.addLegend
          ? {
              title: styleOptions?.legendTitle || (canUseValueMapping ? 'Ranges' : 'Counts'),
              orient: styleOptions.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
        ...(canUseValueMapping && {
          scale: {
            domain: validMappings?.reduce((acc, m) => {
              acc.push(m.type === 'range' ? `[${m.range?.min},${m?.range?.max ?? '∞'})` : m.value);
              return acc;
            }, [] as Array<string | undefined>),
            range: validMappings?.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
          },
        }),
      },
      ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: yAxis?.column,
            type: 'nominal',
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
          {
            field: xAxis?.column,
            type: 'temporal',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            title: `${xAxisStyle?.title?.text || 'start'}`,
          },
          {
            field: 'end',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            type: 'temporal',
            title: 'end',
          },
          {
            field: 'duration',
            type: 'nominal',
            title: 'duration',
          },
          {
            field: 'mergedCount',
            type: 'nominal',
            title: 'Record counts',
          },
        ],
      }),
    },
  };

  const textLayer =
    canUseValueMapping && styleOptions?.exclusive?.showValues && !styleOptions?.useThresholdColor
      ? {
          mark: { type: 'text', align: 'center', baseline: 'middle' },
          transform: [
            {
              calculate: 'toDate(datum.start) + (toDate(datum.end) - toDate(datum.start)) / 2',
              as: 'midX',
            },
          ],
          encoding: {
            y: {
              field: yAxis?.column,
              type: 'nominal',
            },
            x: { field: 'midX', type: 'temporal' },
            text: { field: 'displayText' },
          },
        }
      : null;

  const baseSpec = {
    $schema: VEGASCHEMA,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName ||
        `${rangeFieldColumn?.name} by ${yAxis?.name} and ${xAxis?.name}`
      : undefined,
    data: { values: processedData },
    layer: [barLayer, textLayer].filter(Boolean),
  };

  return baseSpec;
};

export const createCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
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
  }
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(
    styleOptions,
    axisColumnMappings
  );

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField2 = colorMapping?.column;
  const categoryName2 = colorMapping?.name;

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const useValueMappingColor =
    !styleOptions.useThresholdColor && [...(valueMappings ?? [])].length > 0;

  const processedData = mergeDataCore({
    timestampField: xAxis?.column,
    groupField: yAxis?.column,
    mappingField: categoryField2,
    valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
    disconnectThreshold,
    connectThreshold,
    useThresholdColor: styleOptions.useThresholdColor,
    useValueMappingColor,
  })(transformedData);

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const canUseValueMapping = useValueMappingColor;

  const transformLayer = canUseValueMapping
    ? [
        {
          lookup: categoryField2,
          from: {
            data: {
              values: valueMappings?.map((mapping) => ({
                mappingValue: mapping?.value,
                displayText: mapping?.displayText,
              })),
            },
            key: 'mappingValue',
            fields: ['mappingValue', 'displayText'],
          },
        },
        {
          filter: 'datum.mappingValue !== null',
        },
      ]
    : null;

  const barLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'rect',
      tooltip: styleOptions.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      y: {
        field: yAxis?.column,
        type: 'nominal',
        scale: { padding: rowHeight },
        axis: {
          ...applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle, disableGrid: true }),
          tickOpacity: 0,
        },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        // use the minimum timeunit to avoid rect overlapping
        timeUnit: 'yearmonthdatehoursminutesseconds',
        axis: {
          ...applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle, disableGrid: true }),
          tickOpacity: 0,
        },
      },
      x2: { field: 'end', type: 'temporal' },
      color: {
        field: canUseValueMapping ? 'mappingValue' : categoryField2,
        type: 'nominal',
        ...(canUseValueMapping && {
          scale: {
            domain: valueMappings?.map((m) => m.value),
            range: valueMappings?.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
          },
        }),
        legend: styleOptions.addLegend
          ? {
              title: styleOptions?.legendTitle,
              orient: styleOptions.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
      },
      ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: yAxis?.column,
            type: 'nominal',
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
          {
            field: xAxis?.column,
            type: 'temporal',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            title: `${xAxisStyle?.title?.text || 'start'}`,
          },
          {
            field: 'end',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            type: 'temporal',
            title: 'end',
          },
          {
            field: 'duration',
            type: 'nominal',
            title: 'duration',
          },
          {
            field: canUseValueMapping ? 'mappingValue' : categoryField2,
            type: 'nominal',
            title: categoryName2,
          },
          {
            field: 'mergedCount',
            type: 'nominal',
            title: 'Record counts',
          },
        ],
      }),
      fillOpacity: {
        condition: { param: 'highlight', value: 1, empty: false },
        value: DEFAULT_OPACITY,
      },
    },
  };

  const textLayer =
    canUseValueMapping && styleOptions?.exclusive?.showValues
      ? {
          mark: { type: 'text', align: 'center', baseline: 'middle' },
          transform: [
            {
              calculate: 'toDate(datum.start) + (toDate(datum.end) - toDate(datum.start)) / 2',
              as: 'midX',
            },
          ],
          encoding: {
            y: {
              field: yAxis?.column,
              type: 'nominal',
            },
            x: { field: 'midX', type: 'temporal' },
            text: { field: 'displayText' },
          },
        }
      : null;

  const layer = [barLayer, textLayer].filter(Boolean);

  const spec: any = {
    $schema: VEGASCHEMA,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName ||
        `${categoryName2} by ${yAxis?.name} and ${xAxis?.name}`
      : undefined,
    data: { values: processedData },
    transform: transformLayer,
    layer,
  };

  return spec;
};

export const createSingleCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
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
  }

  const { xAxis, xAxisStyle, yAxisStyle } = getSwappedAxisRole(styleOptions, axisColumnMappings);

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField = colorMapping?.column;
  const categoryName = colorMapping?.name;

  const { valueMappings, disconnectThreshold, connectThreshold } = normalizeConfig(styleOptions);

  const useValueMappingColor =
    !styleOptions.useThresholdColor && [...(valueMappings ?? [])].length > 0;

  const processedData = mergeDataCore({
    timestampField: xAxis?.column,
    groupField: undefined,
    mappingField: categoryField,
    valueMappings,
    disconnectThreshold,
    connectThreshold,
    useThresholdColor: styleOptions.useThresholdColor,
    useValueMappingColor,
  })(transformedData);
  const canUseValueMapping = useValueMappingColor;

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const transformLayer = canUseValueMapping
    ? [
        {
          lookup: categoryField,
          from: {
            data: {
              values: valueMappings?.map((mapping) => ({
                mappingValue: mapping?.value,
                displayText: mapping?.displayText,
              })),
            },
            key: 'mappingValue',
            fields: ['mappingValue', 'displayText'],
          },
        },
        {
          filter: 'datum.mappingValue !== null',
        },
      ]
    : [];

  const barLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'rect',
      tooltip: styleOptions.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      y: {
        field: 'fakeYAxis',
        scale: { padding: rowHeight },
        axis: {
          ...applyAxisStyling({
            axis: colorMapping,
            axisStyle: yAxisStyle,
            disableGrid: true,
            defaultAxisTitle: colorMapping?.name,
          }),
          labels: false,
          tickOpacity: 0,
        },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        // use the minimum timeunit to avoid rect overlapping
        timeUnit: 'yearmonthdatehoursminutesseconds',
        axis: {
          ...applyAxisStyling({
            axis: xAxis,
            axisStyle: xAxisStyle,
            disableGrid: true,
          }),
          tickOpacity: 0,
        },
      },
      x2: { field: 'end', type: 'temporal' },
      color: {
        field: canUseValueMapping ? 'mappingValue' : categoryField,
        type: 'nominal',
        ...(canUseValueMapping && {
          scale: {
            domain: valueMappings?.map((m) => m.value),
            range: valueMappings?.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
          },
        }),
        legend: styleOptions.addLegend
          ? {
              title: styleOptions?.legendTitle,
              orient: styleOptions.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
      },
      ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: categoryField,
            type: 'nominal',
            title: yAxisStyle?.title?.text || categoryName,
          },
          {
            field: xAxis?.column,
            type: 'temporal',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            title: `${xAxisStyle?.title?.text || 'start'}`,
          },
          {
            field: 'end',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            type: 'temporal',
            title: 'end',
          },
          {
            field: 'duration',
            type: 'nominal',
            title: 'duration',
          },
          {
            field: 'mergedCount',
            type: 'nominal',
            title: 'Record counts',
          },
        ],
      }),
      fillOpacity: {
        condition: { param: 'highlight', value: 1, empty: false },
        value: DEFAULT_OPACITY,
      },
    },
  };

  const textLayer =
    canUseValueMapping && styleOptions?.exclusive?.showValues
      ? {
          mark: { type: 'text', align: 'center', baseline: 'middle' },
          transform: [
            {
              calculate: 'toDate(datum.start) + (toDate(datum.end) - toDate(datum.start)) / 2',
              as: 'midX',
            },
          ],
          encoding: {
            y: {
              field: 'fakeYAxis',
            },
            x: { field: 'midX', type: 'temporal' },
            text: { field: 'displayText' },
          },
        }
      : null;

  const baseSpec = {
    $schema: VEGASCHEMA,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName || `${categoryName} by ${xAxis?.name}`
      : undefined,
    data: { values: processedData },
    transform: [
      ...transformLayer,
      // This is a fake field intentionally created to force Vega-Lite to draw an axis.
      {
        calculate: "'Response'",
        as: 'fakeYAxis',
      },
    ],
    layer: [barLayer, textLayer].filter(Boolean),
  };

  return baseSpec;
};

export const createSingleNumericalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
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
  }

  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(
    styleOptions,
    axisColumnMappings
  );

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField = colorMapping?.column;
  const categoryName = colorMapping?.name;

  const { valueMappings, rangeMappings, disconnectThreshold, connectThreshold } = normalizeConfig(
    styleOptions
  );
  const completeThreshold = [
    { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
    ...(styleOptions.thresholdOptions.thresholds || []),
  ];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const useValueMappingColor =
    !styleOptions.useThresholdColor &&
    [...(valueMappings ?? []), ...(rangeMappings ?? [])].length > 0;

  const processedData = mergeDataCore({
    timestampField: xAxis?.column,
    groupField: undefined,
    mappingField: categoryField,
    valueMappings: styleOptions.useThresholdColor ? [] : valueMappings,
    rangeMappings: styleOptions.useThresholdColor ? convertedThresholds : rangeMappings,
    disconnectThreshold,
    connectThreshold,
    useThresholdColor: styleOptions.useThresholdColor,
    useValueMappingColor,
  })(transformedData);

  const canUseValueMapping = useValueMappingColor || styleOptions.useThresholdColor;

  const validMappings = styleOptions.useThresholdColor
    ? convertedThresholds
    : [...(valueMappings ?? []), ...(rangeMappings ?? [])];

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const barLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'rect',
      tooltip: styleOptions.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      y: {
        field: 'fakeYAxis',
        scale: { padding: rowHeight },
        axis: {
          ...applyAxisStyling({
            axis: colorMapping,
            axisStyle: yAxisStyle,
            disableGrid: true,
            defaultAxisTitle: colorMapping?.name,
          }),
          labels: false,
          tickOpacity: 0,
        },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        // use the minimum timeunit to avoid rect overlapping
        timeUnit: 'yearmonthdatehoursminutesseconds',
        axis: {
          ...applyAxisStyling({
            axis: xAxis,
            axisStyle: xAxisStyle,
            disableGrid: true,
          }),
          tickOpacity: 0,
        },
      },
      x2: { field: 'end', type: 'temporal' },
      color: {
        field: canUseValueMapping ? 'mergedLabel' : categoryField,
        type: 'nominal',
        legend: styleOptions.addLegend
          ? {
              title: styleOptions?.legendTitle || (canUseValueMapping ? 'Ranges' : 'Counts'),
              orient: styleOptions.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
        ...(canUseValueMapping && {
          scale: {
            domain: validMappings?.reduce((acc, m) => {
              acc.push(m.type === 'range' ? `[${m.range?.min},${m?.range?.max ?? '∞'})` : m.value);
              return acc;
            }, [] as Array<string | undefined>),
            range: validMappings?.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
          },
        }),
      },
      ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: categoryField,
            type: 'nominal',
            title: yAxisStyle?.title?.text || categoryName,
          },
          {
            field: xAxis?.column,
            type: 'temporal',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            title: `${xAxisStyle?.title?.text || 'start'}`,
          },
          {
            field: 'end',
            timeUnit: 'yearmonthdatehoursminutesseconds',
            type: 'temporal',
            title: 'end',
          },
          {
            field: 'duration',
            type: 'nominal',
            title: 'duration',
          },
          {
            field: 'mergedCount',
            type: 'nominal',
            title: 'Record counts',
          },
        ],
      }),
      fillOpacity: {
        condition: { param: 'highlight', value: 1, empty: false },
        value: DEFAULT_OPACITY,
      },
    },
  };

  const textLayer =
    canUseValueMapping && styleOptions?.exclusive?.showValues
      ? {
          mark: { type: 'text', align: 'center', baseline: 'middle' },
          transform: [
            {
              calculate: 'toDate(datum.start) + (toDate(datum.end) - toDate(datum.start)) / 2',
              as: 'midX',
            },
            {
              filter: 'datum.midX > toDate(datum.start)',
            },
            { filter: 'datum.displayText !== null' },
          ],
          encoding: {
            y: {
              field: 'fakeYAxis',
            },
            x: { field: 'midX', type: 'temporal' },
            text: { field: 'displayText' },
          },
        }
      : null;

  const baseSpec = {
    $schema: VEGASCHEMA,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName || `${categoryName} by ${xAxis?.name}`
      : undefined,
    data: { values: processedData },
    layer: [barLayer, textLayer].filter(Boolean),
  };

  return baseSpec;
};
