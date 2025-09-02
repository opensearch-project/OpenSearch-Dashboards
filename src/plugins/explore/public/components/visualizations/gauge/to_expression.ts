/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GaugeChartStyleControls } from './gauge_vis_config';
import { VisColumn, AxisRole, AxisColumnMappings } from '../types';
import {
  locateRange,
  generateRanges,
  generateArcExpression,
  mergeCustomRangesWithBase,
} from './gauge_chart_utils';
import { calculateValue } from '../utils/utils';

export const createGauge = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<GaugeChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
) => {
  // Only contains one and the only one value
  const valueColumn = axisColumnMappings?.[AxisRole.Value];
  const numericField = valueColumn?.column;
  const numericName = valueColumn?.name;

  let numericalValues: number[] = [];
  let maxNumber: number = 0;
  if (numericField) {
    numericalValues = transformedData
      .map((d) => Number(d[numericField]))
      .filter((n) => !Number.isNaN(n));

    maxNumber = Math.max(...numericalValues);
  }

  const calculatedValue = calculateValue(numericalValues, styleOptions.valueCalculation);

  const targetValue = calculatedValue || 0;

  const minBase = styleOptions?.min || 0;
  const maxBase = styleOptions?.max || maxNumber;

  const mergedRanges = mergeCustomRangesWithBase(
    minBase,
    maxBase,
    styleOptions.baseColor || '#9EE9FA',
    styleOptions.thresholdValues
  );

  // Locate which range the target value falls into
  const locateIndex = locateRange(mergedRanges, targetValue);

  // if locateIndex is -1 or minBase > targetValue which infers that the threshold value or min base is valid, use default gray color
  const fillColor =
    locateIndex < 0 || minBase > targetValue ? '#cbd1d6' : mergedRanges[locateIndex].color;

  const ranges = generateRanges(mergedRanges, maxBase);

  const signals = [
    { name: 'centerX', update: 'width/2' },
    { name: 'centerY', update: 'height/2 + outerRadius/4' },
    { name: 'radiusRef', update: 'min(width/2, height/2)' },
    { name: 'outerRadius', update: 'radiusRef * 0.9' },
    { name: 'innerRadius', update: 'outerRadius - outerRadius * 0.25' },

    { name: 'backgroundColor', value: '#cbd1d6' },
    {
      name: 'fillColor',
      value: fillColor,
    },

    { name: 'mainValue', value: targetValue },
    {
      name: 'usedValue',
      update: 'min(max(minValue, mainValue), maxValue)',
    },
    { name: 'minValue', value: minBase },
    { name: 'maxValue', value: maxBase },
    {
      name: 'gapColor',
      value: '#ffffffff',
    },
    {
      name: 'ticksColor',
      value: '#000000',
    },
    {
      name: 'showTicks',
      value: true,
    },
    { name: 'fontFactor', update: '(radiusRef/5)/25' },
    { name: 'fontColor', value: '#666161ff' },
  ];

  const scales = [
    {
      name: 'gaugeScale',
      type: 'linear',
      domain: { signal: '[minValue, maxValue]' },
      zero: false,
      range: { signal: '[-PI*0.6, PI*0.6]' },
    },
  ];

  const rangeArcs = ranges.map((range) => generateArcExpression(range.min, range.max, range.color));

  const titleLayer = styleOptions.showTitle
    ? [
        {
          type: 'text',
          description: 'displayed title',
          name: 'gaugeTitle',
          encode: {
            enter: {
              x: { signal: 'centerX' },
              baseline: { value: 'top' },
              align: { value: 'center' },
            },
            update: {
              text: { value: styleOptions.title || numericName || 'Gauge' },
              y: { signal: 'centerY', offset: { signal: 'fontFactor*10' } },
              fontSize: { signal: 'fontFactor * 10' },
              fill: { signal: 'fontColor' },
            },
          },
        },
      ]
    : [];
  const marks = [
    {
      type: 'arc',
      name: 'gauge',
      encode: {
        enter: {
          x: { signal: 'centerX' },
          y: { signal: 'centerY' },
          startAngle: { signal: '-PI*0.6' },
          endAngle: { signal: 'PI*0.6' },
          outerRadius: { signal: 'outerRadius' },
          innerRadius: { signal: 'innerRadius' },
          fill: { signal: 'backgroundColor' },
        },
      },
    },
    {
      type: 'arc',
      description: 'gap',
      encode: {
        enter: {
          x: { signal: 'centerX' },
          y: { signal: 'centerY' },
          startAngle: { signal: '-PI*0.6' },
          endAngle: { signal: 'PI*0.6' },
          outerRadius: { signal: 'innerRadius' },
          innerRadius: { signal: 'innerRadius*0.98' },
          fill: { signal: 'gapColor' },
        },
      },
    },
    {
      type: 'arc',
      name: 'value',
      encode: {
        enter: { startAngle: { signal: '-PI*0.6' } },
        update: {
          x: { signal: 'centerX' },
          y: { signal: 'centerY' },
          innerRadius: { signal: 'innerRadius' },
          outerRadius: { signal: 'outerRadius' },
          endAngle: { scale: 'gaugeScale', signal: 'usedValue' },
          fill: { signal: 'fillColor' },
        },
      },
    },
    ...rangeArcs,
    {
      type: 'text',
      description: 'displayed main value at the bottom center of the gauge ',
      name: 'gaugeValue',
      encode: {
        enter: {
          x: { signal: 'centerX' },
          baseline: { value: 'top' },
          align: { value: 'center' },
        },
        update: {
          text: { signal: "format(mainValue, '.1f')" },
          y: { signal: 'centerY', offset: { signal: '-fontFactor*30' } },
          fontSize: { signal: 'fontFactor * 30' },
          fill: { signal: 'fillColor' },
        },
      },
    },
    ...titleLayer,
  ];

  const baseSpec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    autosize: { type: 'fit', contains: 'padding' },
    signals,
    scales,
    marks,
  };

  return baseSpec;
};
