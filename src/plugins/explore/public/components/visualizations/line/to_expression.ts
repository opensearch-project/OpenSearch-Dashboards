/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyleControls } from './line_vis_config';
import { VisColumn, Positions, VEGASCHEMA, AxisColumnMappings, AxisRole } from '../types';
import {
  buildMarkConfig,
  createTimeMarkerLayer,
  applyAxisStyling,
  ValueAxisPosition,
} from './line_chart_utils';
import { createThresholdLayer, getStrokeDash } from '../style_panel/threshold_lines/utils';
import { getTooltipFormat } from '../utils/utils';

/**
 * Rule 1: Create a simple line chart with one metric and one date
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a simple line chart
 */
export const createSimpleLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<LineChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];

  const metricField = yAxisColumn?.column;
  const dateField = xAxisColumn?.column;
  const metricName = styles.valueAxes?.[0]?.title?.text || yAxisColumn?.name;
  const dateName = styles.categoryAxes?.[0]?.title?.text || xAxisColumn?.name;
  const layers: any[] = [];

  const mainLayer = {
    mark: buildMarkConfig(styles, 'line'),
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
        axis: applyAxisStyling(
          {
            title: dateName,
            labelAngle: -45,
            labelSeparation: 8,
          },
          styles,
          'category',
          numericalColumns,
          [],
          dateColumns
        ),
      },
      y: {
        field: metricField,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metricName },
          styles,
          'value',
          numericalColumns,
          [],
          dateColumns
        ),
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: dateField,
            type: 'temporal',
            title: dateName,
            format: getTooltipFormat(transformedData, dateField),
          },
          { field: metricField, type: 'quantitative', title: metricName },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} Over Time`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};

/**
 * Rule 2: Create a combined line and bar chart with two metrics and one date
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a combined line and bar chart
 */
export const createLineBarChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<LineChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const yAxisMapping = axisColumnMappings?.[AxisRole.Y];
  const xAxisMapping = axisColumnMappings?.[AxisRole.X];
  const secondYAxisMapping = axisColumnMappings?.[AxisRole.Y_SECOND];

  const metric1Field = yAxisMapping?.column;
  const metric2Field = secondYAxisMapping?.column;
  const dateField = xAxisMapping?.column;
  const metric1Name = styles.valueAxes?.[0]?.title?.text || yAxisMapping?.name;
  const metric2Name = styles.valueAxes?.[1]?.title?.text || secondYAxisMapping?.name;
  const dateName = styles.categoryAxes?.[0]?.title?.text || xAxisMapping?.name;
  const layers: any[] = [];

  const barLayer = {
    mark: buildMarkConfig(styles, 'bar'),
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
        axis: applyAxisStyling(
          {
            title: dateName,
            labelAngle: -45,
            labelSeparation: 8,
          },
          styles,
          'category',
          numericalColumns,
          [],
          dateColumns
        ),
      },
      y: {
        field: metric1Field,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metric1Name },
          styles,
          'value',
          numericalColumns,
          [],
          dateColumns,
          ValueAxisPosition.Left // First value axis which is on the left
        ),
      },
      color: {
        datum: metric1Name,
        legend: styles.addLegend
          ? {
              title: 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: dateField,
            type: 'temporal',
            title: dateName,
            format: getTooltipFormat(transformedData, dateField),
          },
          { field: metric1Field, type: 'quantitative', title: metric1Name },
        ],
      }),
    },
  };

  const barWithThresholdLayer = {
    layer: [barLayer],
  };

  const lineLayer = {
    mark: buildMarkConfig(styles, 'line'),
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
      },
      y: {
        field: metric2Field,
        type: 'quantitative',
        axis: applyAxisStyling(
          {
            title: metric2Name,
            orient: Positions.RIGHT,
          },
          styles,
          'value',
          numericalColumns,
          [],
          dateColumns,
          ValueAxisPosition.Right // Second value axis which is on the right
        ),
        scale: { zero: false },
      },
      color: {
        datum: metric2Name,
        legend: styles.addLegend
          ? {
              title: 'Metrics',
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: dateField,
            type: 'temporal',
            title: dateName,
            format: getTooltipFormat(transformedData, dateField),
          },
          { field: metric2Field, type: 'quantitative', title: metric2Name },
        ],
      }),
    },
  };

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
  if (thresholdLayer) {
    barWithThresholdLayer.layer.push(thresholdLayer);
  }

  layers.push(barWithThresholdLayer, lineLayer);

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metric1Name} (Bar) and ${metric2Name} (Line) Over Time`
      : undefined,
    data: { values: transformedData },
    layer: layers,
    resolve: {
      scale: { y: 'independent' },
    },
  };
};

/**
 * Rule 3: Create a multi-line chart with one metric, one date, and one categorical column
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a multi-line chart
 */
export const createMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<LineChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];

  const metricField = yAxisColumn?.column;
  const dateField = xAxisColumn?.column;
  const categoryField = colorColumn?.column;
  const metricName = styles.valueAxes?.[0]?.title?.text || yAxisColumn?.name;
  const dateName = styles.categoryAxes?.[0]?.title?.text || xAxisColumn?.name;
  const categoryName = colorColumn?.name;
  const layers: any[] = [];

  const mainLayer = {
    mark: buildMarkConfig(styles, 'line'),
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
        axis: applyAxisStyling(
          {
            title: dateName,
            labelAngle: -45,
            labelSeparation: 8,
          },
          styles,
          'category',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      y: {
        field: metricField,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metricName },
          styles,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      color: {
        field: categoryField,
        type: 'nominal',
        legend:
          styles?.addLegend !== false
            ? {
                title: categoryName,
                orient: styles?.legendPosition || Positions.RIGHT,
              }
            : null,
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: dateField,
            type: 'temporal',
            title: dateName,
            format: getTooltipFormat(transformedData, dateField),
          },
          { field: metricField, type: 'quantitative', title: metricName },
          { field: categoryField, type: 'nominal', title: categoryName },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} Over Time by ${categoryName}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};

/**
 * Rule 4: Create a faceted multi-line chart with one metric, one date, and two categorical columns
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a faceted multi-line chart
 */
export const createFacetedMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<LineChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const yAxisMapping = axisColumnMappings?.[AxisRole.Y];
  const xAxisMapping = axisColumnMappings?.[AxisRole.X];
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const facetMapping = axisColumnMappings?.[AxisRole.FACET];

  const metricField = yAxisMapping?.column;
  const dateField = xAxisMapping?.column;
  const category1Field = colorMapping?.column;
  const category2Field = facetMapping?.column;
  const metricName = styles.valueAxes?.[0]?.title?.text || yAxisMapping?.name;
  const dateName = styles.categoryAxes?.[0]?.title?.text || xAxisMapping?.name;
  const category1Name = colorMapping?.name;
  const category2Name = facetMapping?.name;

  // Create a mark config for the faceted spec
  const facetMarkConfig = buildMarkConfig(styles, 'line');

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName ||
        `${metricName} Over Time by ${category1Name} (Faceted by ${category2Name})`
      : undefined,
    data: { values: transformedData },
    facet: {
      field: category2Field,
      type: 'nominal',
      header: { title: category2Name },
    },
    spec: {
      layer: [
        {
          mark: facetMarkConfig,
          encoding: {
            x: {
              field: dateField,
              type: 'temporal',
              axis: applyAxisStyling(
                {
                  title: dateName,
                  labelAngle: -45,
                  labelSeparation: 8,
                },
                styles,
                'category',
                numericalColumns,
                categoricalColumns,
                dateColumns
              ),
            },
            y: {
              field: metricField,
              type: 'quantitative',
              axis: applyAxisStyling(
                { title: metricName },
                styles,
                'value',
                numericalColumns,
                categoricalColumns,
                dateColumns
              ),
            },
            color: {
              field: category1Field,
              type: 'nominal',
              legend:
                styles?.addLegend !== false
                  ? {
                      title: category1Name,
                      orient: styles?.legendPosition || Positions.RIGHT,
                    }
                  : null,
            },
            ...(styles.tooltipOptions?.mode !== 'hidden' && {
              tooltip: [
                {
                  field: dateField,
                  type: 'temporal',
                  title: dateName,
                  format: getTooltipFormat(transformedData, dateField),
                },
                { field: metricField, type: 'quantitative', title: metricName },
                { field: category1Field, type: 'nominal', title: category1Name },
              ],
            }),
          },
        },
        // Add threshold layer to each facet if enabled
        ...(styles?.thresholdLines && styles.thresholdLines.length > 0
          ? styles.thresholdLines
              .filter((threshold) => threshold.show)
              .map((threshold) => ({
                mark: {
                  type: 'rule',
                  color: threshold.color,
                  strokeWidth: threshold.width,
                  strokeDash: getStrokeDash(threshold.style),
                  tooltip: styles?.tooltipOptions?.mode !== 'hidden',
                },
                encoding: {
                  y: {
                    datum: threshold.value,
                    type: 'quantitative',
                  },
                  ...(styles?.tooltipOptions?.mode !== 'hidden' && {
                    tooltip: {
                      value: `${threshold.name ? threshold.name + ': ' : ''}Threshold: ${
                        threshold.value
                      }`,
                    },
                  }),
                },
              }))
          : []),
        // Add time marker to each facet if enabled
        ...(styles?.addTimeMarker
          ? [
              {
                mark: {
                  type: 'rule',
                  color: '#FF6B6B',
                  strokeWidth: 2,
                  strokeDash: [3, 3],
                  tooltip: styles?.tooltipOptions?.mode !== 'hidden',
                },
                encoding: {
                  x: {
                    datum: { expr: 'now()' },
                    type: 'temporal',
                  },
                  ...(styles?.tooltipOptions?.mode !== 'hidden' && {
                    tooltip: {
                      value: 'Current Time',
                    },
                  }),
                },
              },
            ]
          : []),
      ],
    },
  };
};

/**
 * Create a category-based line chart with one metric and one category
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a category-based line chart
 */
export const createCategoryLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<LineChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length === 0) {
    throw new Error(
      'Category line chart requires at least one numerical column and one categorical column'
    );
  }

  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];

  const metricField = yAxisColumn?.column;
  const categoryField = xAxisColumn?.column;
  const metricName = styles.valueAxes?.[0]?.title?.text || yAxisColumn?.name;
  const categoryName = styles.categoryAxes?.[0]?.title?.text || xAxisColumn?.name;
  const layers: any[] = [];

  const mainLayer = {
    mark: buildMarkConfig(styles, 'line'),
    encoding: {
      x: {
        field: categoryField,
        type: 'nominal',
        axis: applyAxisStyling(
          {
            title: categoryName,
            labelAngle: -45,
            labelSeparation: 8,
          },
          styles,
          'category',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      y: {
        field: metricField,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: metricName },
          styles,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: metricField, type: 'quantitative', title: metricName },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles.thresholdLines, styles.tooltipOptions?.mode);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} by ${categoryName}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};
