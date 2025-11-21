/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChartStyle } from './area_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AxisRole } from '../types';
import { buildMarkConfig, createTimeMarkerLayer, applyAxisStyling } from '../line/line_chart_utils';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import { applyTimeRangeToEncoding, getSwappedAxisRole, getTooltipFormat } from '../utils/utils';
import { DEFAULT_OPACITY } from '../constants';
import { createCrosshairLayers, createHighlightBarLayers } from '../utils/create_hover_state';
import { createTimeRangeBrush, createTimeRangeUpdater } from '../utils/time_range_brush';

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
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  // Using getSwappedAxisRole here but area chart doesn't have switchAxes config for now
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);
  const metricField = yAxis?.column;
  const dateField = xAxis?.column;

  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  const dateName = xAxisStyle?.title?.text || xAxis?.name;
  const layers: any[] = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  const mainLayer = {
    params: [createTimeRangeBrush({ timeAxis: 'x' })],
    mark: {
      ...buildMarkConfig(styles, 'area'),
      type: 'area',
      opacity: styles.areaOpacity || DEFAULT_OPACITY,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
        axis: applyAxisStyling(
          {
            title: '',
            labelAngle: -45,
            labelSeparation: 8,
          },
          xAxisStyle,
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
          { title: '' },
          yAxisStyle,
          'value',
          numericalColumns,
          [],
          dateColumns
        ),
      },
      ...(showTooltip && {
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
  layers.push({
    layer: createCrosshairLayers(
      {
        x: {
          name: dateField ?? '',
          type: 'temporal',
          title: dateName,
          format: getTooltipFormat(transformedData, dateField),
        },
        y: {
          name: metricField ?? '',
          type: 'quantitative',
          title: metricName,
        },
      },
      { showTooltip, data: transformedData }
    ),
  });

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  if (styles.showFullTimeRange) {
    applyTimeRangeToEncoding(mainLayer.encoding, axisColumnMappings, timeRange);
  }

  return {
    $schema: VEGASCHEMA,
    params: [...(dateField ? [createTimeRangeUpdater()] : [])],
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} Over Time`
      : undefined,
    data: { values: transformedData },
    layer: layers,
    // Add legend configuration if needed, or explicitly set to null if disabled
    legend: styles.addLegend
      ? {
          orient: styles.legendPosition?.toLowerCase() || 'right',
          title: styles.legendTitle,
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
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const metricField = yAxis?.column;
  const dateField = xAxis?.column;
  const categoryField = colorColumn?.column;

  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  const dateName = xAxisStyle?.title?.text || xAxis?.name;
  const categoryName = colorColumn?.name;
  const layers: any[] = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  const mainLayer = {
    params: [createTimeRangeBrush({ timeAxis: 'x' })],
    mark: {
      ...buildMarkConfig(styles, 'area'),
      type: 'area',
      opacity: styles.areaOpacity || DEFAULT_OPACITY,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
        axis: applyAxisStyling(
          {
            title: '',
            labelAngle: -45,
            labelSeparation: 8,
          },
          xAxisStyle,
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
          { title: '' },
          yAxisStyle,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      color: {
        field: categoryField,
        type: 'nominal',
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition?.toLowerCase() || 'right',
            }
          : null,
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(showTooltip && {
        tooltip: [
          {
            field: dateField,
            type: 'temporal',
            title: dateName,
            format: getTooltipFormat(transformedData, dateField),
          },
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: metricField, type: 'quantitative', title: metricName },
        ],
      }),
    },
  };

  layers.push(mainLayer);
  layers.push({
    layer: createCrosshairLayers(
      {
        x: {
          name: dateField ?? '',
          type: 'temporal',
          title: dateName,
          format: getTooltipFormat(transformedData, dateField),
        },
        y: {
          name: metricField ?? '',
          type: 'quantitative',
          title: metricName,
          stack: true,
        },
        color: {
          name: categoryField ?? '',
          type: 'nominal',
          title: categoryName,
        },
      },
      { showTooltip, data: transformedData }
    ),
  });

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  if (styles.showFullTimeRange) {
    applyTimeRangeToEncoding(mainLayer.encoding, axisColumnMappings, timeRange);
  }

  return {
    $schema: VEGASCHEMA,
    params: [...(dateField ? [createTimeRangeUpdater()] : [])],
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} Over Time by ${categoryName}`
      : undefined,
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
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const facetMapping = axisColumnMappings?.[AxisRole.FACET];

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const metricField = yAxis?.column;
  const dateField = xAxis?.column;
  const category1Field = colorMapping?.column;
  const category2Field = facetMapping?.column;
  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  const dateName = xAxisStyle?.title?.text || xAxis?.name;
  const category1Name = colorMapping?.name;
  const category2Name = facetMapping?.name;
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);

  const mainLayerEncoding = {
    x: {
      field: dateField,
      type: 'temporal',
      axis: applyAxisStyling(
        {
          title: '',
          labelAngle: -45,
          labelSeparation: 8,
        },
        xAxisStyle,
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
        { title: '' },
        yAxisStyle,
        'value',
        numericalColumns,
        categoricalColumns,
        dateColumns
      ),
    },
    color: {
      field: category1Field,
      type: 'nominal',
      legend: styles.addLegend
        ? {
            title: styles.legendTitle,
            orient: styles.legendPosition?.toLowerCase() || 'right',
          }
        : null,
    },
    // Optional: Add tooltip with all information if tooltip mode is not hidden
    ...(showTooltip && {
      tooltip: [
        {
          field: dateField,
          type: 'temporal',
          title: dateName,
          format: getTooltipFormat(transformedData, dateField),
        },
        { field: category1Field, type: 'nominal', title: category1Name },
        { field: metricField, type: 'quantitative', title: metricName },
      ],
    }),
  };

  // Apply time range to main layer's scale if enabled
  if (styles.showFullTimeRange && timeRange) {
    applyTimeRangeToEncoding(mainLayerEncoding, axisColumnMappings, timeRange);
  }

  return {
    $schema: VEGASCHEMA,
    params: [...(dateField ? [createTimeRangeUpdater()] : [])],
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
          params: [createTimeRangeBrush({ timeAxis: 'x' })],
          mark: {
            ...buildMarkConfig(styles, 'area'),
            type: 'area',
            opacity: styles.areaOpacity || DEFAULT_OPACITY,
            tooltip: styles.tooltipOptions?.mode !== 'hidden',
          },
          encoding: mainLayerEncoding,
        },
        {
          layer: createCrosshairLayers(
            {
              x: {
                name: dateField ?? '',
                type: 'temporal',
                title: dateName,
                format: getTooltipFormat(transformedData, dateField),
              },
              y: {
                name: metricField ?? '',
                type: 'quantitative',
                title: metricName,
                stack: true,
              },
              color: {
                name: category1Field ?? '',
                type: 'nominal',
                title: category1Name,
              },
            },
            { showTooltip, data: transformedData }
          ),
        },
        // Add threshold layer to each facet if enabled
        ...(thresholdLayer?.layer ?? []),
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
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const metricField = yAxis?.column;
  const categoryField = xAxis?.column;
  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  const categoryName = xAxisStyle?.title?.text || xAxis?.name;
  const layers: any[] = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  const mainLayer = {
    mark: {
      ...buildMarkConfig(styles, 'area'),
      type: 'area',
      opacity: styles.areaOpacity || DEFAULT_OPACITY,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: categoryField,
        type: 'nominal',
        axis: applyAxisStyling(
          {
            title: '',
            labelAngle: -45,
            labelSeparation: 8,
          },
          xAxisStyle,
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
          { title: '' },
          yAxisStyle,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(showTooltip && {
        tooltip: [
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: metricField, type: 'quantitative', title: metricName },
        ],
      }),
    },
  };

  layers.push(mainLayer);
  layers.push({
    layer: createHighlightBarLayers(
      {
        x: {
          name: categoryField ?? '',
          type: 'nominal',
          title: categoryName,
        },
        y: {
          name: metricField ?? '',
          type: 'quantitative',
          title: metricName,
        },
      },
      { showTooltip, data: transformedData }
    ),
  });

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    layers.push(...thresholdLayer.layer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} by ${categoryName}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
    // Add legend configuration if needed, or explicitly set to null if disabled
    legend: styles.addLegend
      ? {
          orient: styles.legendPosition?.toLowerCase() || 'right',
          title: styles.legendTitle,
        }
      : null,
  };
};

export const createStackedAreaChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: AreaChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const metricField = yAxis?.column;
  const categoryField1 = xAxis?.column; // X-axis (categories)
  const categoryField2 = colorMapping?.column; // Color (stacking)
  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  const categoryName1 = xAxisStyle?.title?.text || xAxis?.name;
  const categoryName2 = colorMapping?.name;
  const layers = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  const mainLayer = {
    mark: {
      type: 'area',
      opacity: styles.areaOpacity || DEFAULT_OPACITY,
      tooltip: styles.tooltipOptions?.mode !== 'hidden',
    },
    encoding: {
      x: {
        field: categoryField1,
        type: 'nominal',
        axis: applyAxisStyling(
          {
            title: '',
            labelAngle: -45,
            labelSeparation: 8,
          },
          xAxisStyle,
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
          { title: '' },
          yAxisStyle,
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
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition?.toLowerCase() || 'bottom',
            }
          : null,
      },
      // Optional: Add tooltip with all information if tooltip mode is not hidden
      ...(showTooltip && {
        tooltip: [
          { field: categoryField1, type: 'nominal', title: categoryName1 },
          { field: categoryField2, type: 'nominal', title: categoryName2 },
          { field: metricField, type: 'quantitative', title: metricName },
        ],
      }),
    },
  };
  layers.push(mainLayer);
  layers.push({
    layer: createHighlightBarLayers(
      {
        x: {
          name: categoryField1 ?? '',
          type: 'nominal',
          title: categoryName1,
        },
        y: {
          name: metricField ?? '',
          type: 'quantitative',
          title: metricName,
          stack: 'normalize',
        },
        color: {
          name: categoryField2 ?? '',
          type: 'nominal',
          title: categoryName2,
        },
      },
      { showTooltip, data: transformedData }
    ),
  });

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} by ${categoryName1} and ${categoryName2}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};
