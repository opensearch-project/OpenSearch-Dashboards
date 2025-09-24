/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, AxisRole, DisableMode, VEGASCHEMA, VisColumn } from '../types';
import { StateTimeLineChartStyleControls } from './state_timeline_config';
import { applyAxisStyling, getSwappedAxisRole } from '../utils/utils';
import { mergeData, mergeNumericalData } from './state_timeline_utils';
import { DEFAULT_OPACITY } from '../constants';
import { getCategoryNextColor } from '../theme/default_colors';

export const createNumercialStateTimeline = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<StateTimeLineChartStyleControls>,
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

  const disableThreshold =
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.disconnectValues?.threshold || '1h'
      : undefined;

  const connectThreshold =
    styleOptions?.exclusive?.connectNullValues?.connectMode === DisableMode.Threshold
      ? styleOptions?.exclusive?.connectNullValues?.threshold || '1h'
      : undefined;

  const mockData = [
    {
      'field-0': '200',
      'field-1': 2846,
      'field-2': '2025-09-23 06:21:45.205',
    },
    {
      'field-0': '200',
      'field-1': 2067,
      'field-2': '2025-09-23 06:38:24.88',
    },
    {
      'field-0': '200',
      'field-1': 9780,
      'field-2': '2025-09-23 07:03:24.938',
    },
    {
      'field-0': '200',
      'field-1': 6667,
      'field-2': '2025-09-23 07:03:48.868',
    },
    {
      'field-0': '200',
      'field-1': 2170,
      'field-2': '2025-09-23 07:05:12.707',
    },
    {
      'field-0': '200',
      'field-1': 7237,
      'field-2': '2025-09-23 07:07:09.683',
    },
    {
      'field-0': '200',
      'field-1': 2496,
      'field-2': '2025-09-23 07:13:14.772',
    },
    {
      'field-0': '200',
      'field-1': 8233,
      'field-2': '2025-09-23 07:14:12.511',
    },
    {
      'field-0': '200',
      'field-1': 9561,
      'field-2': '2025-09-23 07:19:14.659',
    },
    {
      'field-0': '200',
      'field-1': 12849,
      'field-2': '2025-09-23 07:20:33.446',
    },
    {
      'field-0': '200',
      'field-1': 9561,
      'field-2': '2025-09-23 07:22:03.007',
    },
    {
      'field-0': '200',
      'field-1': 9730,
      'field-2': '2025-09-23 07:37:40.995',
    },
    {
      'field-0': '200',
      'field-1': 3193,
      'field-2': '2025-09-23 07:41:27.076',
    },
    {
      'field-0': '200',
      'field-1': 917,
      'field-2': '2025-09-23 07:43:34.094',
    },
    {
      'field-0': '200',
      'field-1': 4343,
      'field-2': '2025-09-23 08:00:03.249',
    },
    {
      'field-0': '404',
      'field-1': 196,
      'field-2': '2025-09-23 08:01:02.138',
    },
    {
      'field-0': '404',
      'field-1': 1000,
      'field-2': '2025-09-23 09:01:02.138',
    },
  ];
  const [processedData, validRanges] = mergeNumericalData(
    mockData,
    xAxis?.column,
    yAxis?.column,
    rangeField,
    rangeMappings,
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
            range: validRanges?.map((m, i) => m.color || getCategoryNextColor(i)),
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
    data: { values: processedData },
    transform: transformLayer,
    layer: [barLayer, textLayer].filter(Boolean),
  };

  return baseSpec;
};

export const createCategoricalStateTimeline = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<StateTimeLineChartStyleControls>,
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

  const mockData = [
    {
      'field-0': '200',
      'field-1': 'Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1',
      'field-2': '2025-09-22 19:45:06.071',
    },

    {
      'field-0': '200',
      'field-1': 'Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1',
      'field-2': '2025-09-22 19:47:06.071',
    },
    {
      'field-0': null,
      'field-1': 'Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1',
      'field-2': '2025-09-22 19:49:03.524',
    },
    {
      'field-0': '200',
      'field-1':
        'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.50 Safari/534.24',
      'field-2': '2025-09-22 20:08:04.399',
    },
    {
      'field-0': '404',
      'field-1':
        'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.50 Safari/534.24',
      'field-2': '2025-09-22 20:25:33.905',
    },
    {
      'field-0': '200',
      'field-1': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)',
      'field-2': '2025-09-22 20:29:29.084',
    },
    {
      'field-0': '503',
      'field-1':
        'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.50 Safari/534.24',
      'field-2': '2025-09-22 20:38:33.615',
    },
    {
      'field-0': '404',
      'field-1': 'Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1',
      'field-2': '2025-09-22 20:56:00.817',
    },
    {
      'field-0': '404',
      'field-1': 'Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1',
      'field-2': '2025-09-22 21:56:00.817',
    },
    {
      'field-0': '200',
      'field-1':
        'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.50 Safari/534.24',
      'field-2': '2025-09-23 00:15:11.611',
    },
    {
      'field-0': '200',
      'field-1':
        'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.50 Safari/534.24',
      'field-2': '2025-09-23 01:52:51.384',
    },
    {
      'field-0': '200',
      'field-1': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)',
      'field-2': '2025-09-23 02:09:29.979',
    },
  ];
  const validMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );
  const [processedData, validValues] = mergeData(
    mockData,
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
            range: validValues?.map((m, i) => m.color || getCategoryNextColor(i)),
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
        `${yAxis?.name} by ${xAxis?.name} and ${categoryName2}`
      : undefined,
    data: { values: processedData },
    transform: transformLayer,
    layer,
  };

  return spec;
};
