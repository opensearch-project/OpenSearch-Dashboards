/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyleControls } from './line_vis_config';
import { VisColumn, Positions, VEGASCHEMA } from '../types';
import {
  buildMarkConfig,
  createTimeMarkerLayer,
  applyAxisStyling,
  ValueAxisPosition,
} from './line_chart_utils';
import { createThresholdLayer, getStrokeDash } from '../style_panel/threshold/utils';

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
  styles: Partial<LineChartStyleControls>
): any => {
  const metricField = numericalColumns[0].column;
  const dateField = dateColumns[0].column;
  const metricName = numericalColumns[0].name;
  const dateName = dateColumns[0].name;
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
    title: `${metricName} Over Time`,
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
  styles: Partial<LineChartStyleControls>
): any => {
  const metric1Field = numericalColumns[0].column;
  const metric2Field = numericalColumns[1].column;
  const dateField = dateColumns[0].column;
  const metric1Name = numericalColumns[0].name;
  const metric2Name = numericalColumns[1].name;
  const dateName = dateColumns[0].name;
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
    },
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
    },
  };

  layers.push(barLayer, lineLayer);

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
    title: `${metric1Name} (Bar) and ${metric2Name} (Line) Over Time`,
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
  styles: Partial<LineChartStyleControls>
): any => {
  const metricField = numericalColumns[0].column;
  const dateField = dateColumns[0].column;
  const categoryField = categoricalColumns[0].column;
  const metricName = numericalColumns[0].name;
  const dateName = dateColumns[0].name;
  const categoryName = categoricalColumns[0].name;
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
    title: `${metricName} Over Time by ${categoryName}`,
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
  styles: Partial<LineChartStyleControls>
): any => {
  const metricField = numericalColumns[0].column;
  const dateField = dateColumns[0].column;
  const category1Field = categoricalColumns[0].column;
  const category2Field = categoricalColumns[1].column;
  const metricName = numericalColumns[0].name;
  const dateName = dateColumns[0].name;
  const category1Name = categoricalColumns[0].name;
  const category2Name = categoricalColumns[1].name;

  // Create a mark config for the faceted spec
  const facetMarkConfig = buildMarkConfig(styles, 'line');

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} Over Time by ${category1Name} (Faceted by ${category2Name})`,
    data: { values: transformedData },
    // Add a max width to the entire visualization and make it scrollable
    width: 'container',
    autosize: {
      type: 'fit-x',
      contains: 'padding',
    },
    facet: {
      field: category2Field,
      type: 'nominal',
      columns: 2,
      header: { title: category2Name },
    },
    spec: {
      width: 250, // Reduced from 300 to fit better
      height: 200,
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
  styles: Partial<LineChartStyleControls>
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length === 0) {
    throw new Error(
      'Category line chart requires at least one numerical column and one categorical column'
    );
  }

  const metricField = numericalColumns[0].column;
  const categoryField = categoricalColumns[0].column;
  const metricName = numericalColumns[0].name;
  const categoryName = categoricalColumns[0].name;
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
    title: `${metricName} by ${categoryName}`,
    data: { values: transformedData },
    layer: layers,
  };
};
