/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChartStyleControls } from './area_vis_config';
import { VisColumn, Positions, VEGASCHEMA } from '../types';
import {
  buildMarkConfig,
  createThresholdLayer,
  createTimeMarkerLayer,
  applyAxisStyling,
  getStrokeDash,
  ValueAxisPosition,
} from '../line/line_chart_utils';

/**
 * Create a simple area chart with one metric and one date
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a simple area chart
 */
export const createSimpleAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<AreaChartStyleControls>
): any => {
  const metricField = numericalColumns[0].column;
  const dateField = dateColumns[0].column;
  const metricName = numericalColumns[0].name;
  const dateName = dateColumns[0].name;
  const layers: any[] = [];

  const mainLayer = {
    mark: {
      ...buildMarkConfig(styles, 'line'),
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
    },
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
  const thresholdLayer = createThresholdLayer(styles);
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
 * Create a multi-area chart with one metric, one date, and one categorical column
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a multi-area chart
 */
export const createMultiAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<AreaChartStyleControls>
): any => {
  const metricField = numericalColumns[0].column;
  const dateField = dateColumns[0].column;
  const categoryField = categoricalColumns[0].column;
  const metricName = numericalColumns[0].name;
  const dateName = dateColumns[0].name;
  const categoryName = categoricalColumns[0].name;
  const layers: any[] = [];

  const mainLayer = {
    mark: {
      ...buildMarkConfig(styles, 'line'),
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
    },
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
  const thresholdLayer = createThresholdLayer(styles);
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
 * Create a faceted multi-area chart with one metric, one date, and two categorical columns
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a faceted multi-area chart
 */
export const createFacetedMultiAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<AreaChartStyleControls>
): any => {
  const metricField = numericalColumns[0].column;
  const dateField = dateColumns[0].column;
  const category1Field = categoricalColumns[0].column;
  const category2Field = categoricalColumns[1].column;
  const metricName = numericalColumns[0].name;
  const dateName = dateColumns[0].name;
  const category1Name = categoricalColumns[0].name;
  const category2Name = categoricalColumns[1].name;

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
          mark: {
            ...buildMarkConfig(styles, 'line'),
            type: 'area',
            opacity: styles.areaOpacity || 0.6,
          },
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
        ...(styles?.thresholdLine?.show
          ? [
              {
                mark: {
                  type: 'rule',
                  color: styles.thresholdLine.color,
                  strokeWidth: styles.thresholdLine.width,
                  strokeDash: getStrokeDash(styles.thresholdLine.style),
                  tooltip: styles?.addTooltip !== false,
                },
                encoding: {
                  y: {
                    datum: styles.thresholdLine.value,
                    type: 'quantitative',
                  },
                  ...(styles?.addTooltip !== false && {
                    tooltip: {
                      value: `Threshold: ${styles.thresholdLine.value}`,
                    },
                  }),
                },
              },
            ]
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
                  tooltip: styles?.addTooltip !== false,
                },
                encoding: {
                  x: {
                    datum: { expr: 'now()' },
                    type: 'temporal',
                  },
                  ...(styles?.addTooltip !== false && {
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
 * Create a stacked area chart with one metric and two categories
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a stacked area chart
 */
/**
 * Create a category-based area chart with one metric and one category
 * @param transformedData The transformed data
 * @param numericalColumns The numerical columns
 * @param categoricalColumns The categorical columns
 * @param dateColumns The date columns
 * @param styles The style options
 * @returns The Vega spec for a category-based area chart
 */
export const createCategoryAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<AreaChartStyleControls>
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length === 0) {
    throw new Error(
      'Category area chart requires at least one numerical column and one categorical column'
    );
  }

  const metricField = numericalColumns[0].column;
  const categoryField = categoricalColumns[0].column;
  const metricName = numericalColumns[0].name;
  const categoryName = categoricalColumns[0].name;
  const layers: any[] = [];

  const mainLayer = {
    mark: {
      ...buildMarkConfig(styles, 'line'),
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
    },
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
  const thresholdLayer = createThresholdLayer(styles);
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

export const createStackedAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<AreaChartStyleControls>
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2) {
    throw new Error(
      'Stacked area chart requires at least one numerical column and two categorical columns'
    );
  }

  const metricField = numericalColumns[0].column;
  const categoryField1 = categoricalColumns[0].column; // X-axis (categories)
  const categoryField2 = categoricalColumns[1].column; // Color (stacking)

  const metricName = numericalColumns[0].name;
  const categoryName1 = categoricalColumns[0].name;
  const categoryName2 = categoricalColumns[1].name;

  const spec: any = {
    $schema: VEGASCHEMA,
    title: `${metricName} by ${categoryName1} and ${categoryName2}`,
    data: { values: transformedData },
    mark: {
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
      tooltip: styles.addTooltip !== false,
    },
    encoding: {
      x: {
        field: categoryField1,
        type: 'nominal',
        axis: applyAxisStyling(
          {
            title: categoryName1,
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
        stack: 'normalize', // Can be 'zero', 'normalize', or 'center'
      },
      // Color: Second categorical field (stacking)
      color: {
        field: categoryField2,
        type: 'nominal',
        legend: {
          title: categoryName2,
          orient: styles.legendPosition?.toLowerCase() || 'bottom',
        },
      },
      // Optional: Add tooltip with all information
      tooltip: [
        { field: categoryField1, type: 'nominal', title: categoryName1 },
        { field: categoryField2, type: 'nominal', title: categoryName2 },
        { field: metricField, type: 'quantitative', title: metricName },
      ],
    },
  };

  // Add threshold line if enabled
  if (styles.thresholdLine?.show) {
    spec.layer = [
      { mark: spec.mark, encoding: spec.encoding },
      {
        mark: {
          type: 'rule',
          color: styles.thresholdLine.color || '#E7664C',
          strokeWidth: styles.thresholdLine.width || 1,
          strokeDash: getStrokeDash(styles.thresholdLine.style),
          tooltip: false,
        },
        encoding: {
          y: { value: styles.thresholdLine.value || 0 },
        },
      },
    ];
    delete spec.mark;
    delete spec.encoding;
  }

  return spec;
};
