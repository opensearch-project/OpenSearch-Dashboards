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
  console.log('styleOptions', styleOptions);
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(
    styleOptions,
    axisColumnMappings
  );

  const rangeFieldColumn = axisColumnMappings?.color as any;
  const rangeField = rangeFieldColumn?.column;
  const rangeName = rangeFieldColumn?.name;

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const disableThreshold = styleOptions?.exclusive?.disconnectValues?.threshold || '1h';

  const [processedData, validRanges] = mergeNumericalData(
    transformedData,
    xAxis?.column,
    yAxis?.column,
    rangeField,
    rangeMappings,
    styleOptions?.exclusive?.disconnectValues?.disableMode === DisableMode.Threshold
      ? disableThreshold
      : undefined
  );

  const canUseValueMapping = styleOptions?.useValueMappingColor && validRanges?.length > 0;

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
            domain: rangeMappings?.map((m) => `[${m.range?.min},${m.range?.max})`),
            range: rangeMappings?.map((m, i) => m.color || getCategoryNextColor(i)),
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
            field: canUseValueMapping ? 'mergedLabel' : 'mergedCount',
            type: 'nominal',
            title: rangeName,
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
              // display text only for bars whose duration is greater than 10 minutes
              filter: 'datum.start !== datum.end',
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

  const [processedData, allPossibleOptions] = mergeData(
    transformedData,
    xAxis?.column,
    yAxis?.column,
    categoryField2
  );

  const validMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const canUseValueMapping =
    styleOptions?.useValueMappingColor &&
    validMappings?.some((mapping) => mapping?.value && allPossibleOptions.includes(mapping.value));

  const transformLayer = canUseValueMapping
    ? [
        {
          lookup: categoryField2,
          from: {
            data: {
              values: validMappings?.map((mapping) => ({
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
        scale: { paddingInner: 0 },
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
        ...(canUseValueMapping
          ? {
              scale: {
                domain: validMappings
                  ?.filter((m) => allPossibleOptions.includes(m.value))
                  .map((m) => m.value),
                range: validMappings
                  ?.filter((m) => allPossibleOptions.includes(m.value))
                  .map((m, i) => m.color || getCategoryNextColor(i)),
              },
            }
          : {}),
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
            // {
            //   calculate: 'toDate(datum.end) - toDate(datum.start)',
            //   as: 'duration',
            // },
            {
              // display text only for bars whose duration is greater than 1 hour
              filter: 'datum.start !== datum.end',
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
