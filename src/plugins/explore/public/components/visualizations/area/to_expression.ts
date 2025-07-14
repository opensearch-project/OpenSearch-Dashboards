/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChartStyleControls } from './area_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AxisRole, VisFieldType } from '../types';
import { buildMarkConfig, createTimeMarkerLayer } from '../line/line_chart_utils';
import { createThresholdLayer, getStrokeDash } from '../style_panel/threshold/utils';
import { applyAxisStyling, getSchemaFromAxisMapping } from '../utils/utils';

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
  styles: Partial<AreaChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];

  const metricField = yAxisColumn?.column;
  const dateField = xAxisColumn?.column;
  const metricName = yAxisColumn?.name;
  const dateName = xAxisColumn?.name;

  const layers: any[] = [];

  const mainLayer = {
    mark: {
      ...buildMarkConfig(styles, 'line'),
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: dateField,
        type: getSchemaFromAxisMapping(xAxisColumn),
        axis: applyAxisStyling(xAxisColumn, styles?.grid?.xLines),
      },
      y: {
        field: metricField,
        type: getSchemaFromAxisMapping(yAxisColumn),
        axis: applyAxisStyling(yAxisColumn, styles?.grid?.yLines),
      },
    },
  };

  layers.push(mainLayer);

  const encodingDefault = yAxisColumn?.schema === VisFieldType.Numerical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
  );
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  // Add time marker layer if enabled
  const timeMarkerLayerEncoding = xAxisColumn?.schema === VisFieldType.Date ? 'x' : 'y';
  const timeMarkerLayer = createTimeMarkerLayer(styles, timeMarkerLayerEncoding);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} Over Time`,
    data: { values: transformedData },
    layer: layers,
    // Add legend configuration if needed, or explicitly set to null if disabled
    legend: styles.addLegend
      ? {
          orient: styles.legendPosition?.toLowerCase() || 'right',
        }
      : null,
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
  styles: Partial<AreaChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];

  const metricField = yAxisColumn?.column;
  const dateField = xAxisColumn?.column;
  const categoryField = colorColumn?.column;
  const metricName = yAxisColumn?.name;
  const dateName = xAxisColumn?.name;
  const categoryName = colorColumn?.name;
  const layers: any[] = [];

  const mainLayer = {
    mark: {
      ...buildMarkConfig(styles, 'line'),
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: dateField,
        type: getSchemaFromAxisMapping(xAxisColumn),
        axis: applyAxisStyling(xAxisColumn, styles?.grid?.xLines),
      },
      y: {
        field: metricField,
        type: getSchemaFromAxisMapping(yAxisColumn),
        axis: applyAxisStyling(yAxisColumn, styles?.grid?.yLines),
      },
      color: {
        field: categoryField,
        type: getSchemaFromAxisMapping(colorColumn),
        legend: styles.addLegend
          ? {
              title: categoryName,
              orient: styles.legendPosition?.toLowerCase() || 'right',
            }
          : null,
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: dateField, type: 'temporal', title: dateName },
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: metricField, type: 'quantitative', title: metricName },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  const encodingDefault = yAxisColumn?.schema === VisFieldType.Numerical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
  );
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  const timeMarkerLayerEncoding = xAxisColumn?.schema === VisFieldType.Date ? 'x' : 'y';

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles, timeMarkerLayerEncoding);
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
  styles: Partial<AreaChartStyleControls>,
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
  const metricName = yAxisMapping?.name;
  const dateName = xAxisMapping?.name;
  const category1Name = colorMapping?.name;
  const category2Name = facetMapping?.name;
  const encodingDefault = yAxisMapping?.schema === VisFieldType.Numerical ? 'y' : 'x';

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
            tooltip: styles.tooltipOptions?.mode !== 'hidden',
          },
          encoding: {
            x: {
              field: dateField,
              type: getSchemaFromAxisMapping(xAxisMapping),
              axis: applyAxisStyling(xAxisMapping, styles?.grid?.xLines),
            },
            y: {
              field: metricField,
              type: getSchemaFromAxisMapping(yAxisMapping),
              axis: applyAxisStyling(yAxisMapping, styles?.grid?.yLines),
            },
            color: {
              field: category1Field,
              type: getSchemaFromAxisMapping(colorMapping),
              legend: styles.addLegend
                ? {
                    title: category1Name,
                    orient: styles.legendPosition?.toLowerCase() || 'right',
                  }
                : null,
            },
            // Optional: Add tooltip with all information if tooltip mode is not hidden
            ...(styles.tooltipOptions?.mode !== 'hidden' && {
              tooltip: [
                { field: dateField, type: getSchemaFromAxisMapping(xAxisMapping), title: dateName },
                {
                  field: category1Field,
                  type: getSchemaFromAxisMapping(colorMapping),
                  title: category1Name,
                },
                {
                  field: metricField,
                  type: getSchemaFromAxisMapping(yAxisMapping),
                  title: metricName,
                },
              ],
            }),
          },
        },
        // Add threshold layer to each facet if enabled
        ...(styles.thresholdLines && styles.thresholdLines.length > 0
          ? styles.thresholdLines
              .filter((threshold) => threshold.show)
              .map((threshold) => ({
                mark: {
                  type: 'rule',
                  color: threshold.color || '#E7664C',
                  strokeWidth: threshold.width || 1,
                  strokeDash: getStrokeDash(threshold.style),
                  tooltip: styles.tooltipOptions?.mode !== 'hidden',
                },
                encoding: {
                  [encodingDefault]: { value: threshold.value || 0 },
                  ...(styles.tooltipOptions?.mode !== 'hidden' && {
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
                  tooltip: styles.tooltipOptions?.mode !== 'hidden',
                },
                encoding: {
                  x: {
                    datum: { expr: 'now()' },
                    type: 'temporal',
                  },
                  ...(styles.tooltipOptions?.mode !== 'hidden' && {
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
  styles: Partial<AreaChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length === 0) {
    throw new Error(
      'Category area chart requires at least one numerical column and one categorical column'
    );
  }

  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];

  const metricField = yAxisColumn?.column;
  const categoryField = xAxisColumn?.column;
  const metricName = yAxisColumn?.name;
  const categoryName = xAxisColumn?.name;
  const layers: any[] = [];

  const mainLayer = {
    mark: {
      ...buildMarkConfig(styles, 'line'),
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: categoryField,
        type: getSchemaFromAxisMapping(xAxisColumn),
        axis: applyAxisStyling(xAxisColumn, styles?.grid?.xLines),
      },
      y: {
        field: metricField,
        type: getSchemaFromAxisMapping(yAxisColumn),
        axis: applyAxisStyling(yAxisColumn, styles?.grid?.yLines),
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: categoryField,
            type: getSchemaFromAxisMapping(xAxisColumn),
            title: categoryName,
          },
          { field: metricField, type: getSchemaFromAxisMapping(yAxisColumn), title: metricName },
        ],
      }),
    },
  };

  layers.push(mainLayer);
  const encodingDefault = yAxisColumn?.schema === VisFieldType.Numerical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
  );
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  return {
    $schema: VEGASCHEMA,
    title: `${metricName} by ${categoryName}`,
    data: { values: transformedData },
    layer: layers,
    // Add legend configuration if needed, or explicitly set to null if disabled
    legend: styles.addLegend
      ? {
          orient: styles.legendPosition?.toLowerCase() || 'right',
        }
      : null,
  };
};

export const createStackedAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: Partial<AreaChartStyleControls>,
  axisColumnMappings?: AxisColumnMappings
): any => {
  // Check if we have the required columns
  if (numericalColumns.length === 0 || categoricalColumns.length < 2) {
    throw new Error(
      'Stacked area chart requires at least one numerical column and two categorical columns'
    );
  }

  const yAxisMapping = axisColumnMappings?.[AxisRole.Y];
  const xAxisMapping = axisColumnMappings?.[AxisRole.X];
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const metricField = yAxisMapping?.column;
  const categoryField1 = xAxisMapping?.column; // X-axis (categories)
  const categoryField2 = colorMapping?.column; // Color (stacking)

  const metricName = yAxisMapping?.name;
  const categoryName1 = xAxisMapping?.name;
  const categoryName2 = colorMapping?.name;

  const spec: any = {
    $schema: VEGASCHEMA,
    title: `${metricName} by ${categoryName1} and ${categoryName2}`,
    data: { values: transformedData },
    mark: {
      type: 'area',
      opacity: styles.areaOpacity || 0.6,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: categoryField1,
        type: getSchemaFromAxisMapping(xAxisMapping),
        axis: applyAxisStyling(xAxisMapping, styles?.grid?.xLines),
      },
      y: {
        field: metricField,
        type: getSchemaFromAxisMapping(yAxisMapping),
        axis: applyAxisStyling(yAxisMapping, styles?.grid?.yLines),
        stack: 'zero', // Can be 'zero', 'normalize', or 'center'
      },
      // Color: Second categorical field (stacking)
      color: {
        field: categoryField2,
        type: getSchemaFromAxisMapping(colorMapping),
        legend: styles.addLegend
          ? {
              title: categoryName2,
              orient: styles.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(styles.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          {
            field: categoryField1,
            type: getSchemaFromAxisMapping(xAxisMapping),
            title: categoryName1,
          },
          {
            field: categoryField2,
            type: getSchemaFromAxisMapping(colorMapping),
            title: categoryName2,
          },
          { field: metricField, type: getSchemaFromAxisMapping(yAxisMapping), title: metricName },
        ],
      }),
    },
  };

  const encodingDefault = xAxisMapping?.schema === VisFieldType.Categorical ? 'y' : 'x';

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(
    styles.thresholdLines,
    styles.tooltipOptions?.mode,
    encodingDefault
  );
  if (thresholdLayer) {
    spec.layer = [{ mark: spec.mark, encoding: spec.encoding }, ...thresholdLayer.layer];
    delete spec.mark;
    delete spec.encoding;
  }

  return spec;
};
