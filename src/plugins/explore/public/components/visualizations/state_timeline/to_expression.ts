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
import { getCategoryNextColor } from '../theme/default_colors';
import { resolveColor } from '../theme/default_colors';

export const createNumercialStateTimeline = (
  transforwmedData: Array<Record<string, any>>,
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
      'field-1': null,
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
      'field-1': 1888,
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
      'field-2': '2025-10-10 15:15:49.302',
    },
    {
      'field-0': '404',
      'field-1': 47,
      'field-2': '2025-10-10 15:16:09.895',
    },

    {
      'field-0': '200',
      'field-1': 8884,
      'field-2': '2025-10-10 15:19:22.088',
    },
    {
      'field-0': '200',
      'field-1': 3426,
      'field-2': '2025-10-10 15:20:27.94',
    },
    {
      'field-0': '200',
      'field-1': 4604,
      'field-2': '2025-10-10 15:21:15.848',
    },
    {
      'field-0': '500',
      'field-1': 6977,
      'field-2': '2025-10-10 15:26:51.127',
    },
    {
      'field-0': '500',
      'field-1': 3636,
      'field-2': '2025-10-11 03:17:31.634',
    },
  ];

  if (valueMappings?.length && valueMappings?.length > 0 && !rangeMappings?.length) {
    return createCategoricalStateTimeline(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions,
      axisColumnMappings
    );
  }
  const disableThreshold =
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.disconnectValues?.threshold || '1h'
      : undefined;

  const connectThreshold =
    styleOptions?.exclusive?.connectNullValues?.connectMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.connectNullValues?.threshold || '1h'
      : undefined;

  const completeThreshold =
    styleOptions.thresholdOptions.thresholds && styleOptions.thresholdOptions.thresholds?.length > 0
      ? [
          { value: 0, color: styleOptions.thresholdOptions.baseColor } as Threshold,
          ...styleOptions.thresholdOptions.thresholds,
        ]
      : [];

  const convertedThresholds = convertThresholdsToValueMappings(completeThreshold);

  console.log('styleOptions', styleOptions);

  const [processedData, validRanges] = mergeNumericalData(
    transformedData,
    xAxis?.column,
    yAxis?.column,
    rangeField,
    styleOptions.useThresholdColor ? convertedThresholds : rangeMappings,
    disableThreshold,
    connectThreshold
  );

  const canUseValueMapping = validRanges && validRanges?.length > 0;

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const transformLayer = canUseValueMapping
    ? [
        {
          lookup: 'mergedLabel',
          from: {
            data: {
              values: rangeMappings?.map((mapping) => ({
                mappingValue: `[${mapping?.range?.min},${mapping?.range?.max})`,
                displayText: mapping?.displayText,
              })),
            },
            key: 'mappingValue',
            fields: ['displayText'],
          },
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
        axis: { ...applyAxisStyling(yAxis, yAxisStyle, true), tickOpacity: 0 },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        timeUnit: 'yearmonthdatehoursminutesseconds',
        axis: { ...applyAxisStyling(xAxis, xAxisStyle, true), tickOpacity: 0 },
      },
      x2: { field: 'end', type: 'temporal' },
      color: {
        field: canUseValueMapping ? 'mergedLabel' : 'mergedCount',
        type: 'nominal',
        legend: styleOptions.addLegend
          ? {
              title: canUseValueMapping ? 'Ranges' : 'Counts',
              orient: styleOptions.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
        ...(canUseValueMapping && {
          scale: {
            domain: validRanges?.map((m) => `[${m.range?.min},${m.range?.max})`),
            range: validRanges?.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
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
    transform: transformLayer,
    layer: [barLayer, textLayer].filter(Boolean),
  };

  return baseSpec;
};

export const createCategoricalStateTimeline = (
  transfor1medData: Array<Record<string, any>>,
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

  const disableThreshold =
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

  // const transformedData = [
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 06:07:51.142',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/5.0/apple',
  //     'field-2': '2025-10-13 06:22:51.218',
  //   },
  //   {
  //     'field-0': '503',
  //     'field-1': 'Mozilla/5.0/apple',
  //     'field-2': '2025-10-13 06:39:00.791',
  //   },
  //   {
  //     'field-0': '503',
  //     'field-1': 'Mozilla/5.0/apple',
  //     'field-2': '2025-10-13 06:59:00.791',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/4.0',
  //     'field-2': '2025-10-13 06:42:02.36',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 06:46:00.335',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 06:54:47.407',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/4.0',
  //     'field-2': '2025-10-13 06:56:47.123',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 06:59:59.032',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/4.0',
  //     'field-2': '2025-10-13 07:06:17.789',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 07:16:27.553',
  //   },
  //   {
  //     'field-0': '404',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 07:18:27.553',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/4.0',
  //     'field-2': '2025-10-13 07:23:45.991',
  //   },
  //   {
  //     'field-0': '404',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 07:28:10.219',
  //   },
  //   {
  //     'field-0': '200',
  //     'field-1': 'Mozilla/5.0/linux',
  //     'field-2': '2025-10-13 08:28:18.219',
  //   },
  // ];
  const [processedData, validValues] = mergeCategoricalData(
    transfor1medData,
    xAxis?.column,
    yAxis?.column,
    categoryField2,
    validMappings,
    disableThreshold,
    connectThreshold
  );

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const canUseValueMapping = validValues && validValues?.length > 0;

  const transformLayer = canUseValueMapping
    ? [
        {
          lookup: categoryField2,
          from: {
            data: {
              values: validValues?.map((mapping) => ({
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
        axis: { ...applyAxisStyling(yAxis, yAxisStyle, true), tickOpacity: 0 },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        // use the minimum timeunit to avoid rect overlapping
        timeUnit: 'yearmonthdatehoursminutesseconds',
        axis: { ...applyAxisStyling(xAxis, xAxisStyle, true), tickOpacity: 0 },
      },
      x2: { field: 'end', type: 'temporal' },
      color: {
        field: canUseValueMapping ? 'mappingValue' : categoryField2,
        type: 'nominal',
        ...(canUseValueMapping && {
          scale: {
            domain: validValues?.map((m) => m.value),
            range: validValues?.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
          },
        }),
        legend: styleOptions.addLegend
          ? {
              title: categoryName2,
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
        `${yAxis?.name} × ${xAxis?.name} × ${categoryName2} State Timeline`
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

  const disableThreshold =
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
    disableThreshold,
    connectThreshold
  );

  const canUseValueMapping = validValues && validValues?.length > 0;

  const rowHeight = 1 - (styleOptions?.exclusive?.rowHeight ?? 0);

  const transformLayer = canUseValueMapping
    ? [
        {
          lookup: categoryField,
          from: {
            data: {
              values: validValues?.map((mapping) => ({
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
          ...applyAxisStyling(colorMapping, yAxisStyle, true),
          labels: false,
          tickOpacity: 0,
        },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        // use the minimum timeunit to avoid rect overlapping
        timeUnit: 'yearmonthdatehoursminutesseconds',
        axis: { ...applyAxisStyling(xAxis, xAxisStyle, true), tickOpacity: 0 },
      },
      x2: { field: 'end', type: 'temporal' },
      color: {
        field: canUseValueMapping ? 'mappingValue' : categoryField,
        type: 'nominal',
        ...(canUseValueMapping && {
          scale: {
            domain: validValues?.map((m) => m.value),
            range: validValues?.map((m, i) => resolveColor(m.color) || getCategoryNextColor(i)),
          },
        }),
        legend: styleOptions.addLegend
          ? {
              title: categoryName,
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
