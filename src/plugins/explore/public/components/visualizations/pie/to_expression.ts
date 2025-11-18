/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defaultPieChartStyles, PieChartStyle } from './pie_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AxisRole } from '../types';
import { DEFAULT_OPACITY } from '../constants';
import {
  generateTransformLayer,
  decideScale,
  generateLabelExpr,
} from '../style_panel/value_mapping/value_mapping_utils';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: PieChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const thetaColumn = axisColumnMappings?.[AxisRole.SIZE];

  const numericField = thetaColumn?.column;
  const numericName = thetaColumn?.name;
  const categoryField = colorColumn?.column;
  const categoryName = colorColumn?.name;

  const valueMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styleOptions?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const numericalOptions = Array.from(new Set(transformedData.map((t) => t[numericField!])));

  const validValues = valueMappings?.filter((r) => {
    if (!r.value) return false;
    return numericalOptions.includes(Number(r.value));
  });

  const validRanges = rangeMappings?.filter((r) => {
    if (!r.range) return false;
    if (r?.range?.min === undefined) return false;

    return transformedData.some((s) => {
      const value = Number(s[numericField!]);
      return (
        r.range?.min !== undefined && value >= r.range.min && value < (r.range.max ?? Infinity)
      );
    });
  });

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styleOptions.filterOption !== 'none';

  const encodingBase = {
    theta: {
      field: numericField,
      type: 'quantitative',
      stack: true,
    },
    color: {
      field: canUseValueMapping ? 'mappingValue' : categoryField,
      ...(canUseValueMapping && {
        scale: decideScale(styleOptions.filterOption, validRanges, validValues),
      }),
      // if color mapping is numerical, also treat it as nominal
      type: 'nominal',
      legend: styleOptions.addLegend
        ? {
            ...(canUseValueMapping && {
              labelExpr: generateLabelExpr(
                validRanges,
                validValues,
                styleOptions?.filterOption ?? 'none'
              ),
            }),
            title: styleOptions.legendTitle,
            orient: styleOptions.legendPosition,
            symbolLimit: 10,
          }
        : null,
    },
  };

  const markLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'arc',
      innerRadius: styleOptions.exclusive?.donut ? { expr: '7*stepSize' } : 0,
      radius: { expr: '9*stepSize' },
      tooltip: styleOptions?.tooltipOptions?.mode === 'all',
      padAngle: styleOptions.exclusive?.donut ? 0.01 : 0,
    },
    encoding: {
      opacity: {
        value: DEFAULT_OPACITY,
        condition: { param: 'highlight', value: 1, empty: false },
      },
      ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: numericField, type: 'quantitative', title: numericName },
        ],
      }),
    },
  };

  const hoverStateLayer = {
    mark: {
      type: 'arc',
      innerRadius: styleOptions.exclusive?.donut ? { expr: '7*stepSize' } : 0,
      radius: { expr: '9*stepSize + 0.35*stepSize' },
      padAngle: styleOptions.exclusive?.donut ? 0.01 : 0,
    },
    encoding: {
      opacity: {
        value: 0,
        condition: { param: 'highlight', value: DEFAULT_OPACITY / 3, empty: false },
      },
    },
  };

  const labelLayer = {
    mark: {
      type: 'text',
      limit: styleOptions.exclusive?.truncate
        ? styleOptions.exclusive?.truncate
        : defaultPieChartStyles.exclusive.truncate,
      radius: { expr: '12*stepSize' },
    },
    encoding: {
      text: {
        field: categoryField,
        type: 'nominal',
      },
    },
  };

  const valueLayer = {
    mark: {
      type: 'text',
      limit: 100,
      radius: { expr: '10*stepSize' },
    },
    encoding: {
      text: {
        field: numericField,
        type: 'nominal',
      },
    },
  };

  const baseSpec = {
    $schema: VEGASCHEMA,
    params: [{ name: 'stepSize', expr: 'min(width, height) / 20' }],
    data: { values: transformedData },
    transform: generateTransformLayer(
      canUseValueMapping,
      numericField,
      validRanges,
      validValues,
      styleOptions?.filterOption ?? 'none'
    ),
    layer: [
      markLayer,
      hoverStateLayer,
      styleOptions.exclusive?.showLabels ? labelLayer : null,
      styleOptions.exclusive?.showValues ? valueLayer : null,
    ].filter(Boolean),
    encoding: encodingBase,
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName || `${numericName} by ${categoryName}`
      : undefined,
  };

  return baseSpec;
};
