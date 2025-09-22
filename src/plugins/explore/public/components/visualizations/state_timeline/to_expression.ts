/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisColumnMappings, AxisRole, VEGASCHEMA, VisColumn, ValueMapping } from '../types';
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
  const rangeName = rangeFieldColumn?.name;
  const [processedData, validRanges] = mergeNumericalData(
    transformedData,
    xAxis?.column,
    yAxis?.column,
    rangeField,
    styleOptions.valueMappingOptions?.valueMappings?.filter((m) => m.type === 'range')
  );

  console.log('transformedData', transformedData);

  console.log('processedData', processedData);

  // function buildCalculateExpr(valueMappings: ValueMapping[] | undefined) {
  //   const parts: string[] = [];
  //   if (!valueMappings) return null;
  //   valueMappings.forEach((m: any) => {
  //     if (m.type === 'range' && m.range) {
  //       const { min, max } = m.range;
  //       const text = m.displayText ?? `[${min}, ${max})`;
  //       parts.push(
  //         `(datum["${yAxis?.column}"] >= ${min} && atum["${yAxis?.column}"] < ${max}) ? '${text}'`
  //       );
  //     }
  //   });

  //   return parts.join(' : ');
  // }

  // function buildColorScale(valueMappings: ValueMapping[] | undefined) {
  //   if (!valueMappings) return { domain: [], range: [] };

  //   const domain: string[] = [];
  //   const range: string[] = [];

  //   valueMappings.forEach((m: any) => {
  //     if (m.type === 'range' && m.range) {
  //       const { min, max } = m.range;
  //       const text = m.displayText ?? `[${min}, ${max}]`;
  //       domain.push(text);
  //       range.push(m.color ?? '#ccc');
  //     }
  //     if (m.type === 'value') {
  //       const text = m.displayText ?? String(m.value);
  //       domain.push(text);
  //       range.push(m.color ?? '#ccc');
  //     }
  //   });

  //   return { domain, range };
  // }

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  console.log('validRanges', validRanges);
  const canUseValueMapping = styleOptions?.useValueMappingColor && validRanges?.length > 0;

  const barLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'bar',
      band: 0.6,
      tooltip: styleOptions.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      y: {
        field: yAxis?.column,
        type: 'nominal',
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
        legend: { title: canUseValueMapping ? 'Ranges' : 'Counts' },
        ...(canUseValueMapping && {
          scale: {
            domain: rangeMappings?.map((m) => `located in [${m.range?.min},${m.range?.max}]`),
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
  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: processedData },
    layer: [barLayer],
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
      type: 'bar',
      band: 0.6,
      tooltip: styleOptions.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      y: {
        field: yAxis?.column,
        type: 'nominal',
        axis: { ...applyAxisStyling(yAxis, yAxisStyle, true), tickOpacity: 0 },
      },
      x: {
        field: xAxis?.column,
        type: 'temporal',
        // use the minimum timeunit to avoid bar overlapping
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
            {
              calculate: 'toDate(datum.end) - toDate(datum.start)',
              as: 'duration',
            },
            {
              // display text only for bars whose duration is greater than 1 hour
              filter: 'datum.start !== datum.end && datum.duration > 3600000',
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
