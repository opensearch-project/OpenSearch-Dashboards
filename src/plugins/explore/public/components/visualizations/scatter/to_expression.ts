/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScatterChartStyle } from './scatter_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings } from '../types';
import { applyAxisStyling, getSwappedAxisRole, getSchemaByAxis } from '../utils/utils';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import {
  buildThresholdColorEncoding,
  buildValueMappingColorEncoding,
  buildCombinedScale,
} from '../bar/bar_chart_utils';
import {
  processData,
  generateTransformLayer,
  generateLabelExpr,
} from '../style_panel/value_mapping/value_mapping_utils';

const DEFAULT_POINTER_SIZE = 80;
const DEFAULT_STROKE_OPACITY = 0.65;

const hoverParams = [
  {
    name: 'hover',
    select: { type: 'point', on: 'mouseover' },
  },
];

const hoverStateEncoding = {
  opacity: {
    value: DEFAULT_STROKE_OPACITY,
    condition: { param: 'hover', value: 1, empty: false },
  },
  stroke: {
    value: null,
    condition: { param: 'hover', value: 'white', empty: false },
  },
  strokeWidth: {
    value: 0,
    condition: { param: 'hover', value: 2, empty: false },
  },
};

export const createTwoMetricScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const valueMappings = styles?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styles?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const { newRecord, validValues, validRanges } = processData({
    transformedData,
    categoricalColumn: xAxis?.column,
    numericalColumn: yAxis?.column,
    transformedCalculationMethod: undefined,
    valueMappings,
    rangeMappings,
  });

  const colorEncodingLayer =
    styles.colorModeOption === 'useThresholdColor'
      ? buildThresholdColorEncoding(yAxis, styles, true)
      : buildValueMappingColorEncoding(styles, validValues, validRanges);

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styles.colorModeOption !== 'none' &&
    styles.colorModeOption !== 'useThresholdColor';

  const markLayer = {
    params: hoverParams,
    mark: {
      type: 'point',
      tooltip: styles?.tooltipOptions?.mode !== 'hidden',
      shape: styles?.exclusive?.pointShape,
      angle: styles?.exclusive?.angle,
      filled: styles?.exclusive?.filled,
      size: DEFAULT_POINTER_SIZE,
      strokeOpacity: DEFAULT_STROKE_OPACITY,
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle }),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }),
      },
      ...hoverStateEncoding,
      color: colorEncodingLayer,
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
        ],
      }),
    },
  };

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);

  const baseSpec = {
    $schema: VEGASCHEMA,
    data: { values: newRecord },
    transform: generateTransformLayer(
      canUseValueMapping,
      yAxis?.column,
      validRanges,
      validValues,
      styles?.colorModeOption
    ),
    layer: [markLayer, thresholdLayer].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${xAxis?.name} with ${yAxis?.name}`
      : undefined,
  };
  return baseSpec;
};

export const createTwoMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const valueMappings = styles?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styles?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const { newRecord, validValues, validRanges, categorical2Options } = processData({
    transformedData,
    categoricalColumn: xAxis?.column,
    numericalColumn: yAxis?.column,
    transformedCalculationMethod: undefined,
    valueMappings,
    rangeMappings,
    categoricalColumn2: categoryFields,
  });

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styles.colorModeOption !== 'none';

  const transformLayer = [
    ...generateTransformLayer(
      canUseValueMapping,
      yAxis?.column,
      validRanges,
      validValues,
      styles?.colorModeOption
    ),
    // create a new field for manual legend categories
    {
      calculate: `datum.mappingValue ? datum.mappingValue : datum['${categoryFields}']`,
      as: 'combinedCategory',
    },
  ];

  const markLayer = {
    params: hoverParams,
    mark: {
      type: 'point',
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
      shape: styles.exclusive?.pointShape,
      angle: styles.exclusive?.angle,
      filled: styles.exclusive?.filled,
      size: DEFAULT_POINTER_SIZE,
      strokeOpacity: DEFAULT_STROKE_OPACITY,
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle }),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }),
      },
      color: {
        field: 'combinedCategory',
        type: 'nominal',
        scale: buildCombinedScale(
          canUseValueMapping,
          categorical2Options,
          validValues,
          validRanges
        ),
        legend: styles.addLegend
          ? {
              ...(canUseValueMapping && {
                labelExpr: generateLabelExpr(rangeMappings, valueMappings, styles?.colorModeOption),
              }),

              title: styles.legendTitle,
              orient: styles.legendPosition?.toLowerCase() || 'bottom',
              symbolLimit: 10,
            }
          : null,
      },
      ...hoverStateEncoding,
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
          { field: categoryFields, type: 'nominal', title: categoryNames },
        ],
      }),
    },
  };

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);

  const baseSpec = {
    $schema: VEGASCHEMA,
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: newRecord },
    transform: transformLayer,
    layer: [markLayer, thresholdLayer].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${xAxis?.name} with ${yAxis?.name} by ${categoryNames}`
      : undefined,
  };
  return baseSpec;
};

export const createThreeMetricOneCateScatter = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: ScatterChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const colorColumn = axisColumnMappings?.color;
  const categoryFields = axisColumnMappings?.color?.column!;
  const categoryNames = axisColumnMappings?.color?.name!;
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const valueMappings = styles?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'value'
  );

  const rangeMappings = styles?.valueMappingOptions?.valueMappings?.filter(
    (mapping) => mapping?.type === 'range'
  );

  const { newRecord, validValues, validRanges, categorical2Options } = processData({
    transformedData,
    categoricalColumn: xAxis?.column,
    numericalColumn: yAxis?.column,
    transformedCalculationMethod: undefined,
    valueMappings,
    rangeMappings,
    categoricalColumn2: categoryFields,
  });

  const canUseValueMapping =
    ((validRanges && validRanges.length > 0) || (validValues && validValues.length > 0)) &&
    styles.colorModeOption !== 'none';

  const transformLayer = [
    ...generateTransformLayer(
      canUseValueMapping,
      yAxis?.column,
      validRanges,
      validValues,
      styles?.colorModeOption
    ),
    // create a new field for manual legend categories
    {
      calculate: `datum.mappingValue ? datum.mappingValue : datum['${categoryFields}']`,
      as: 'combinedCategory',
    },
  ];

  const numericalSize = axisColumnMappings?.size;
  const markLayer = {
    params: hoverParams,
    mark: {
      type: 'point',
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
      shape: styles.exclusive?.pointShape,
      angle: styles.exclusive?.angle,
      filled: styles.exclusive?.filled,
      size: DEFAULT_POINTER_SIZE,
      strokeOpacity: DEFAULT_STROKE_OPACITY,
    },
    encoding: {
      x: {
        field: xAxis?.column,
        type: getSchemaByAxis(xAxis),
        axis: applyAxisStyling({ axis: xAxis, axisStyle: xAxisStyle }),
      },
      y: {
        field: yAxis?.column,
        type: getSchemaByAxis(yAxis),
        axis: applyAxisStyling({ axis: yAxis, axisStyle: yAxisStyle }),
      },
      color: {
        field: 'combinedCategory',
        type: 'nominal',
        scale: buildCombinedScale(
          canUseValueMapping,
          categorical2Options,
          validValues,
          validRanges
        ),
        legend: styles.addLegend
          ? {
              ...(canUseValueMapping && {
                labelExpr: generateLabelExpr(rangeMappings, valueMappings, styles?.colorModeOption),
              }),

              title: styles.legendTitle,
              orient: styles.legendPosition?.toLowerCase() || 'bottom',
              symbolLimit: 10,
            }
          : null,
      },
      size: {
        field: numericalSize?.column,
        type: getSchemaByAxis(numericalSize),
        legend: styles?.addLegend
          ? {
              title: styles?.legendTitleForSize ?? '',
              orient: styles?.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      ...hoverStateEncoding,
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: xAxis?.column,
            type: getSchemaByAxis(xAxis),
            title: xAxisStyle?.title?.text || xAxis?.name,
          },
          {
            field: yAxis?.column,
            type: getSchemaByAxis(yAxis),
            title: yAxisStyle?.title?.text || yAxis?.name,
          },
          { field: categoryFields, type: 'nominal', title: categoryNames },
          { field: numericalSize?.column, type: 'quantitative', title: numericalSize?.name },
        ],
      }),
    },
  };

  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);

  const baseSpec = {
    $schema: VEGASCHEMA,
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: newRecord },
    transform: transformLayer,
    layer: [markLayer, thresholdLayer].filter(Boolean),
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName ||
        `${xAxis?.name} with ${yAxis?.name} by ${categoryNames} (Size shows ${numericalSize?.name})`
      : undefined,
  };
  return baseSpec;
};
