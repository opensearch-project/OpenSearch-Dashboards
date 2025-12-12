/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import { DashboardAnnotation } from '../../../../../dashboard/public';
import { AreaChartStyle } from './area_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AxisRole } from '../types';
import { buildMarkConfig, createTimeMarkerLayer, applyAxisStyling } from '../line/line_chart_utils';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import { applyTimeRangeToEncoding, getTooltipFormat } from '../utils/utils';
import { DEFAULT_OPACITY } from '../constants';
import { createCrosshairLayers, createHighlightBarLayers } from '../utils/create_hover_state';
import { createTimeRangeBrush, createTimeRangeUpdater } from '../utils/time_range_brush';

/**
 * Create annotation layers for Vega-Lite area charts
 * @param annotations Array of dashboard annotations
 * @param timeRange Time range for filtering annotations
 * @param dateField The date field name used in the chart
 * @returns Array of Vega-Lite layer objects for annotations
 */
const createAnnotationLayers = (
  annotations: DashboardAnnotation[] = [],
  timeRange?: { from: string; to: string },
  dateField?: string
): any[] => {
  if (!annotations.length || !timeRange || !dateField) {
    return [];
  }

  // Parse time range - handle relative time strings like 'now-2d', 'now'
  const startMoment = dateMath.parse(timeRange.from);
  const endMoment = dateMath.parse(timeRange.to, { roundUp: true });

  if (!startMoment || !endMoment || !startMoment.isValid() || !endMoment.isValid()) {
    return [];
  }

  const startTime = startMoment.valueOf();
  const endTime = endMoment.valueOf();
  const annotationLayers: any[] = [];

  annotations.forEach((annotation) => {
    if (!annotation.enabled || !annotation.showAnnotations) {
      return;
    }

    // Handle PPL query annotations
    if (annotation.query.queryType === 'ppl-query' && annotation.query.pplResultTimestamps) {
      annotation.query.pplResultTimestamps.forEach((timestamp: any) => {
        // Convert timestamp to milliseconds if needed
        let timestampMs: number;
        if (typeof timestamp === 'string') {
          timestampMs = new Date(timestamp).getTime();
        } else if (typeof timestamp === 'number') {
          // Handle both seconds and milliseconds timestamps
          timestampMs = timestamp > 10000000000 ? timestamp : timestamp * 1000;
        } else {
          return;
        }

        // Check if timestamp is within the visible time range
        if (timestampMs >= startTime && timestampMs <= endTime) {
          annotationLayers.push({
            data: { values: [{}] },
            mark: {
              type: 'rule',
              color: annotation.defaultColor || '#FF6B6B',
              strokeWidth: 2,
              strokeDash: [5, 5],
              opacity: 0.8,
              tooltip: true,
            },
            encoding: {
              x: {
                datum: timestampMs,
                type: 'temporal',
                scale: { type: 'time' },
              },
              tooltip: {
                value: `${annotation.name}: ${new Date(timestampMs).toLocaleString()}`,
              },
            },
          });
        }
      });
      return;
    }

    if (
      annotation.query.queryType !== 'time-regions' ||
      !annotation.query.fromTime ||
      !annotation.query.toTime
    ) {
      return;
    }

    const [fromHour, fromMinute] = annotation.query.fromTime.split(':').map(Number);
    const [toHour, toMinute] = annotation.query.toTime.split(':').map(Number);

    // Generate annotation time ranges
    const currentDate = new Date(startTime);
    while (currentDate.getTime() <= endTime) {
      const dayOfWeek = currentDate.getDay().toString();

      // Check if this day should have annotations
      let shouldAnnotate = false;
      if (annotation.query.fromType === 'everyday') {
        shouldAnnotate = true;
      } else if (
        annotation.query.fromType === 'weekdays' &&
        annotation.query.fromWeekdays?.includes(dayOfWeek)
      ) {
        shouldAnnotate = true;
      }

      if (shouldAnnotate) {
        const annotationStart = new Date(currentDate);
        annotationStart.setHours(fromHour, fromMinute, 0, 0);

        let annotationEnd = new Date(currentDate);
        annotationEnd.setHours(toHour, toMinute, 0, 0);

        // Handle cross-day annotations
        if (
          annotation.query.toType === 'weekdays' &&
          annotation.query.toWeekdays &&
          annotation.query.toWeekdays.length > 0
        ) {
          const currentToDay = currentDate.getDay().toString();
          if (!annotation.query.toWeekdays.includes(currentToDay)) {
            // Find next valid day
            const searchDate = new Date(currentDate);
            let found = false;
            for (let i = 1; i <= 7 && !found; i++) {
              searchDate.setDate(searchDate.getDate() + 1);
              if (
                annotation.query.toWeekdays?.includes(searchDate.getDay().toString()) &&
                searchDate.getTime() <= endTime
              ) {
                annotationEnd = new Date(searchDate);
                annotationEnd.setHours(toHour, toMinute, 0, 0);
                found = true;
              }
            }
            if (!found) {
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
          }
        }

        // If end time is before start time, assume next day
        if (annotationEnd.getTime() <= annotationStart.getTime()) {
          annotationEnd.setDate(annotationEnd.getDate() + 1);
        }

        // Check if annotation overlaps with visible range
        if (annotationStart.getTime() < endTime && annotationEnd.getTime() > startTime) {
          // Create rectangle annotation for time ranges
          if (annotationEnd.getTime() !== annotationStart.getTime()) {
            annotationLayers.push({
              data: { values: [{}] }, // Provide data source for the annotation
              mark: {
                type: 'rect',
                opacity: 0.2,
                fill: annotation.defaultColor || '#FF6B6B',
                stroke: annotation.defaultColor || '#FF6B6B',
                strokeWidth: 1,
                strokeOpacity: 0.6,
                tooltip: true,
              },
              encoding: {
                x: {
                  datum: Math.max(annotationStart.getTime(), startTime), // Start from visible range
                  type: 'temporal',
                  scale: { type: 'time' },
                },
                x2: {
                  datum: Math.min(annotationEnd.getTime(), endTime),
                  type: 'temporal',
                },
                y: { value: 0 },
                y2: { expr: 'height' },
                tooltip: {
                  value: `${annotation.name}: ${annotationStart.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - ${annotationEnd.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`,
                },
              },
            });
          }

          // Create line annotations for start and end points
          // Only show start line if start time is within visible range
          if (annotationStart.getTime() >= startTime && annotationStart.getTime() <= endTime) {
            annotationLayers.push({
              data: { values: [{}] },
              mark: {
                type: 'rule',
                color: annotation.defaultColor || '#FF6B6B',
                strokeWidth: 2,
                strokeDash: [5, 5],
                opacity: 0.8,
                tooltip: true,
              },
              encoding: {
                x: {
                  datum: annotationStart.getTime(),
                  type: 'temporal',
                  scale: { type: 'time' },
                },
                tooltip: {
                  value: `${annotation.name} Start: ${annotationStart.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`,
                },
              },
            });
          }

          if (
            annotationEnd.getTime() !== annotationStart.getTime() &&
            annotationEnd.getTime() <= endTime
          ) {
            annotationLayers.push({
              data: { values: [{}] },
              mark: {
                type: 'rule',
                color: annotation.defaultColor || '#FF6B6B',
                strokeWidth: 2,
                strokeDash: [5, 5],
                opacity: 0.8,
                tooltip: true,
              },
              encoding: {
                x: {
                  datum: Math.min(annotationEnd.getTime(), endTime),
                  type: 'temporal',
                  scale: { type: 'time' },
                },
                tooltip: {
                  value: `${annotation.name} End: ${annotationEnd.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`,
                },
              },
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return annotationLayers;
};

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
  timeRange?: { from: string; to: string },
  annotations?: DashboardAnnotation[]
): any => {
  const yAxisColumn = axisColumnMappings?.[AxisRole.Y];
  const xAxisColumn = axisColumnMappings?.[AxisRole.X];

  const metricField = yAxisColumn?.column;
  const dateField = xAxisColumn?.column;
  const metricName = styles.valueAxes?.[0]?.title?.text || yAxisColumn?.name;
  const dateName = styles.categoryAxes?.[0]?.title?.text || xAxisColumn?.name;
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
        axis: applyAxisStyling({ title: '' }, styles, 'value', numericalColumns, [], dateColumns),
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

  // Add annotation layers
  const annotationLayers = createAnnotationLayers(annotations, timeRange, dateField);
  layers.push(...annotationLayers);

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
  timeRange?: { from: string; to: string },
  annotations?: DashboardAnnotation[]
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
          { title: '' },
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

  // Add annotation layers
  const annotationLayers = createAnnotationLayers(annotations, timeRange, dateField);
  layers.push(...annotationLayers);

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
  timeRange?: { from: string; to: string },
  annotations?: DashboardAnnotation[]
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
        { title: '' },
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
        // Add annotation layers to each facet
        ...createAnnotationLayers(annotations, timeRange, dateField),
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
  const metricName = styles.valueAxes?.[0]?.title?.text || yAxisColumn?.name;
  const categoryName = styles.categoryAxes?.[0]?.title?.text || xAxisColumn?.name;
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
          { title: '' },
          styles,
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
  const yAxisMapping = axisColumnMappings?.[AxisRole.Y];
  const xAxisMapping = axisColumnMappings?.[AxisRole.X];
  const colorMapping = axisColumnMappings?.[AxisRole.COLOR];

  const metricField = yAxisMapping?.column;
  const categoryField1 = xAxisMapping?.column; // X-axis (categories)
  const categoryField2 = colorMapping?.column; // Color (stacking)
  const metricName = styles.valueAxes?.[0]?.title?.text || yAxisMapping?.name;
  const categoryName1 = styles.categoryAxes?.[0]?.title?.text || xAxisMapping?.name;
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
          { title: '' },
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
