/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GaugeChartStyleControls, defaultGaugeChartStyles } from './gauge_vis_config';
import { VisColumn, AxisRole, AxisColumnMappings, VEGASCHEMA } from '../types';
import {
  locateThreshold,
  generateRanges,
  generateArcExpression,
  mergeThresholdsWithBase,
} from './gauge_chart_utils';
import { calculateValue } from '../utils/calculation';

export const createGauge = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<GaugeChartStyleControls>,
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

  const styleOptions = { ...defaultGaugeChartStyles, ...styles };

  const calculatedValue = calculateValue(numericalValues, styleOptions.valueCalculation);

  const targetValue = calculatedValue || 0;

  const minBase = styleOptions?.min || 0;
  const maxBase = styleOptions?.max || maxNumber;

  const mergedThresholds = mergeThresholdsWithBase(
    minBase,
    maxBase,
    // TODO: update to use the color from color palette
    styleOptions.baseColor || '#9EE9FA',
    styleOptions.thresholds
  );

  // Locate which threshold the target value falls into
  const targetThreshold = locateThreshold(mergedThresholds, targetValue);

  // if threshold is not found or minBase > targetValue or minBase >= maxBase, use default gray color
  const fillColor =
    !targetThreshold || minBase > targetValue || minBase >= maxBase
      ? '#cbd1d6'
      : targetThreshold.color;

  const ranges = generateRanges(mergedThresholds, maxBase);

  const params = [
    { name: 'centerX', expr: 'width/2' },
    { name: 'centerY', expr: 'height/2 + outerRadius/4' },
    { name: 'radiusRef', expr: 'min(width/2, height/2)' },
    { name: 'outerRadius', expr: 'radiusRef * 0.9' },
    { name: 'innerRadius', expr: 'outerRadius - outerRadius * 0.25' },

    { name: 'backgroundColor', value: '#cbd1d6' },
    {
      name: 'fillColor',
      value: fillColor,
    },
    {
      name: 'gapColor',
      value: '#ffffffff',
    },
    { name: 'fontColor', value: '#666161ff' },

    { name: 'mainValue', value: targetValue },
    {
      name: 'usedValue',
      expr: 'min(max(minValue, mainValue), maxValue)',
    },
    { name: 'minValue', value: minBase },
    { name: 'maxValue', value: maxBase },

    { name: 'fontFactor', expr: '(radiusRef/5)/25' },
    { name: 'theta_single_arc', value: -2 },
    { name: 'theta2_single_arc', value: 2 },
  ];

  const rangeArcs = ranges.map((range) => generateArcExpression(range.min, range.max, range.color));

  const titleLayer = styleOptions.showTitle
    ? [
        {
          mark: {
            type: 'text',
            align: 'center',
            y: { expr: 'centerY' },
            dy: { expr: 'fontFactor*10' },
            x: { expr: 'centerX' },
            fontSize: { expr: 'fontFactor * 10' },
            fill: { expr: 'fontColor' },
          },
          encoding: { text: { value: styleOptions.title || numericName || 'Gauge' } },
        },
      ]
    : [];
  const layer = [
    {
      mark: {
        type: 'arc',
        y: { expr: 'centerY' },
        x: { expr: 'centerX' },
        radius: { expr: 'outerRadius' },
        radius2: { expr: 'innerRadius' },
        theta: { expr: 'theta_single_arc' },
        theta2: { expr: 'theta2_single_arc' },
        fill: { expr: 'backgroundColor' },
      },
    },
    {
      mark: {
        type: 'arc',
        y: { expr: 'centerY' },
        x: { expr: 'centerX' },
        radius: { expr: 'innerRadius' },
        radius2: { expr: 'innerRadius*0.98' },
        theta: { expr: 'theta_single_arc' },
        theta2: { expr: 'theta2_single_arc' },
        fill: { expr: 'gapColor' },
      },
    },
    {
      mark: {
        type: 'arc',
        y: { expr: 'centerY' },
        x: { expr: 'centerX' },
        radius: { expr: 'outerRadius' },
        radius2: { expr: 'innerRadius' },
        theta: { expr: 'theta_single_arc' },
        // No need to worry if maxValue === minValue(invalid case); Vega-Lite will handle it as 0.5, and we have already set the color to the default grey.
        theta2: {
          expr:
            'theta_single_arc + (theta2_single_arc - theta_single_arc) * ((usedValue - minValue)/(maxValue - minValue))',
        },
        fill: { expr: 'fillColor' },
      },
    },
    ...rangeArcs,
    {
      mark: {
        type: 'text',
        baseline: 'top',
        align: 'center',
        y: { expr: 'centerY' },
        x: { expr: 'centerX' },
        dy: { expr: '-fontFactor*30' },
        fontSize: { expr: 'fontFactor * 30' },
        fill: { expr: 'fillColor' },
      },
      encoding: { text: { value: { expr: "format(mainValue, '.1f')" } } },
    },
    ...titleLayer,
  ];

  const baseSpec = {
    $schema: VEGASCHEMA,
    params,
    data: { values: [{}] },
    autosize: { type: 'fit', contains: 'padding' },
    layer,
  };

  return baseSpec;
};
