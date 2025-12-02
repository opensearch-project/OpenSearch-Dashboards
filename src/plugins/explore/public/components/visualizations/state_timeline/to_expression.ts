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
import { applyAxisStyling, getSwappedAxisRole } from '../utils/utils';
import {
  mergeCategoricalData,
  mergeNumericalData,
  mergeSingleCategoricalData,
  convertThresholdsToValueMappings,
} from './state_timeline_utils';
import { DEFAULT_OPACITY } from '../constants';
import {
  generateTransformLayer,
  decideScale,
  generateLabelExpr,
} from '../style_panel/value_mapping/value_mapping_utils';

export const createNumericalStateTimeline = (
  transfsormedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
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

  const transformedData = [
    {
      'field-0': '200',
      'field-1': 1000,
      'field-2': '2025-10-10 13:00:25.215',
    },
    {
      'field-0': '200',
      'field-1': 1200,
      'field-2': '2025-10-10 13:09:58.196',
    },
    {
      'field-0': '200',
      'field-1': null,
      'field-2': '2025-10-10 14:11:34.325',
    },
    {
      'field-0': '200',
      'field-1': null,
      'field-2': '2025-10-10 15:08:42.43',
    },
    {
      'field-0': '404',
      'field-1': 1223,
      'field-2': '2025-10-10 15:11:20.728',
    },
    {
      'field-0': '200',
      'field-1': 76,
      'field-2': '2025-10-10 16:15:49.302',
    },
    {
      'field-0': '200',
      'field-1': 76,
      'field-2': '2025-10-10 16:40:49.302',
    },
    {
      'field-0': '404',
      'field-1': 47,
      'field-2': '2025-10-10 15:16:09.895',
    },

    {
      'field-0': '200',
      'field-1': 8884,
      'field-2': '2025-10-10 17:19:22.088',
    },
    {
      'field-0': '200',
      'field-1': 3426,
      'field-2': '2025-10-10 18:20:27.94',
    },
    {
      'field-0': '200',
      'field-1': 4604,
      'field-2': '2025-10-10 19:21:15.848',
    },
    {
      'field-0': '500',
      'field-1': 6977,
      'field-2': '2025-10-10 15:26:51.127',
    },
    {
      'field-0': '500',
      'field-1': 5636,
      'field-2': '2025-10-11 03:17:31.634',
    },
  ];

  const disconnectThreshold =
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.disconnectValues?.threshold || '1h'
      : undefined;

  const connectThreshold =
    styleOptions?.exclusive?.connectNullValues?.connectMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.connectNullValues?.threshold || '1h'
      : undefined;

  const completeThreshold = styleOptions.thresholdOptions.thresholds
    ? [
        { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
        ...styleOptions.thresholdOptions.thresholds,
      ]
    : [];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  const [processedData, validRanges, validValues] = mergeNumericalData(
    transformedData,
    xAxis?.column,
    yAxis?.column,
    rangeField,
    styleOptions.colorModeOption === 'useThresholdColor' ? convertedThresholds : rangeMappings,
    styleOptions?.colorModeOption === 'useThresholdColor' ? [] : valueMappings,
    disconnectThreshold,
    connectThreshold,
    styleOptions?.colorModeOption
  );

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styleOptions.colorModeOption !== 'none';

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
        field: canUseValueMapping ? 'mappingValue' : rangeField,
        type: 'nominal',
        ...(canUseValueMapping && {
          scale: decideScale(styleOptions.colorModeOption, validRanges, validValues),
        }),
        legend: styleOptions.addLegend
          ? {
              ...(canUseValueMapping && {
                labelExpr: generateLabelExpr(
                  validRanges,
                  validValues,
                  styleOptions?.colorModeOption
                ),
              }),
              title: styleOptions?.legendTitle || (canUseValueMapping && 'Ranges'),
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
            ...(styleOptions?.colorModeOption === 'none'
              ? {
                  field: rangeField,
                  type: 'nominal',
                  title: rangeFieldColumn.name,
                }
              : {}),
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
            { filter: 'datum.displayText != null' },
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
        `${yAxis?.name} × ${xAxis?.name} × ${rangeFieldColumn?.name} State Timeline`
      : undefined,
    data: { values: processedData },
    transform: generateTransformLayer(
      canUseValueMapping,
      undefined,
      validRanges,
      validValues,
      styleOptions?.colorModeOption
    ),
    layer: [barLayer, textLayer].filter(Boolean),
  };

  return baseSpec;
};

export const createCategoricalStateTimeline = (
  transformedsData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: StateTimeLineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(
    styleOptions,
    axisColumnMappings
  );

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField2 = colorMapping?.column;
  const categoryName2 = colorMapping?.name;

  const disconnectThreshold =
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.disconnectValues?.threshold || '1h'
      : undefined;

  const connectThreshold =
    styleOptions?.exclusive?.connectNullValues?.connectMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.connectNullValues?.threshold || '1h'
      : undefined;

  const validMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const transformedData = [
    {
      'field-0': '200',
      'field-2': '2025-10-10 13:00:25.215',
      'field-1': 'A',
    },
    {
      'field-0': '200',
      'field-1': 'A',
      'field-2': '2025-10-10 13:09:58.196',
    },
    {
      'field-0': '200',
      'field-1': null,
      'field-2': '2025-10-10 14:11:34.325',
    },
    {
      'field-0': '200',
      'field-1': 'C',
      'field-2': '2025-10-10 15:08:42.43',
    },
    {
      'field-0': '404',
      'field-1': 'B',
      'field-2': '2025-10-10 15:11:20.728',
    },
    {
      'field-0': '200',
      'field-1': 'C',
      'field-2': '2025-10-10 16:15:49.302',
    },
    {
      'field-0': '404',
      'field-1': 'B',
      'field-2': '2025-10-10 15:16:09.895',
    },

    {
      'field-0': '200',
      'field-1': 'B',
      'field-2': '2025-10-10 17:19:22.088',
    },
    {
      'field-0': '200',
      'field-1': 'B',
      'field-2': '2025-10-10 18:20:27.94',
    },
    {
      'field-0': '200',
      'field-1': 'C',
      'field-2': '2025-10-10 19:21:15.848',
    },
  ];
  const [processedData, validValues] = mergeCategoricalData(
    transformedData,
    xAxis?.column,
    yAxis?.column,
    categoryField2,
    validMappings,
    disconnectThreshold,
    connectThreshold,
    styleOptions?.colorModeOption
  );

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const canUseValueMapping = validValues && validValues?.length > 0;

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
          scale: decideScale(styleOptions.colorModeOption, [], validValues),
        }),
        legend: styleOptions.addLegend
          ? {
              ...(canUseValueMapping && {
                labelExpr: generateLabelExpr([], validValues, styleOptions?.colorModeOption),
              }),
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
            field: categoryField2,
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
            {
              filter: 'datum.midX > toDate(datum.start)',
            },
            { filter: 'datum.displayText !== null' },
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
        `${yAxis?.name} × ${xAxis?.name} × ${categoryName2} State Timeline`
      : undefined,
    data: { values: processedData },
    transform: generateTransformLayer(
      canUseValueMapping,
      categoryField2,
      [],
      validValues,
      styleOptions?.colorModeOption,
      true
    ),
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
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(
    styleOptions,
    axisColumnMappings
  );

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const categoryField = colorMapping?.column;
  const categoryName = colorMapping?.name;

  const disconnectThreshold =
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.disconnectValues?.threshold || '1h'
      : undefined;

  const connectThreshold =
    styleOptions?.exclusive?.connectNullValues?.connectMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.connectNullValues?.threshold || '1h'
      : undefined;

  const [processedData, validValues] = mergeSingleCategoricalData(
    transformedData,
    xAxis?.column,
    categoryField,
    rangeMappings,
    disconnectThreshold,
    connectThreshold,
    styleOptions?.colorModeOption
  );

  const canUseValueMapping = validValues && validValues?.length > 0;

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
        field: canUseValueMapping ? 'mappingValue' : categoryField,
        type: 'nominal',
        ...(canUseValueMapping && {
          scale: decideScale(styleOptions.colorModeOption, [], validValues),
        }),
        legend: styleOptions.addLegend
          ? {
              ...(canUseValueMapping && {
                labelExpr: generateLabelExpr([], validValues, styleOptions?.colorModeOption),
              }),
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
    transform: [
      ...generateTransformLayer(
        canUseValueMapping,
        categoryField,
        [],
        validValues,
        styleOptions?.colorModeOption,
        true
      ),
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
