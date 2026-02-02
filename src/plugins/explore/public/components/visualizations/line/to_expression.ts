/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyle } from './line_vis_config';
import { VisColumn, Positions, VEGASCHEMA, AxisColumnMappings, AxisRole } from '../types';
import {
  buildMarkConfig,
  createTimeMarkerLayer,
  applyAxisStyling,
  ValueAxisPosition,
  createLineSeries,
  createLineBarSeries,
  createFacetLineSeries,
} from './line_chart_utils';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import {
  applyTimeRangeToEncoding,
  getAxisByRole,
  getSwappedAxisRole,
  getTooltipFormat,
  getChartRender,
} from '../utils/utils';
import { createCrosshairLayers, createHighlightBarLayers } from '../utils/create_hover_state';
import { createTimeRangeBrush, createTimeRangeUpdater } from '../utils/time_range_brush';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  applyTimeRange,
} from '../utils/echarts_spec';
import {
  convertTo2DArray,
  transform,
  pivot,
  sortByTime,
  facetTransform,
  flatten,
} from '../utils/data_transformation';
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
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

    const timeField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;

    if (!valueField || !timeField) throw Error('Missing axis config for line chart');

    const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

    const result = pipe(
      transform(sortByTime(axisColumnMappings?.x?.column), convertTo2DArray(allColumns)),
      createBaseConfig({ title: `${axisConfig.yAxis?.name} Over Time`, legend: { show: false } }),
      buildAxisConfigs,
      applyTimeRange,
      createLineSeries({
        styles,
        categoryField: timeField,
        seriesFields: [valueField],
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
      timeRange,
    });

    return result.spec;
  }

  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const metricField = yAxis?.column;
  const dateField = xAxis?.column;
  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  const dateName = xAxisStyle?.title?.text || xAxis?.name;
  const layers: any[] = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  const mainLayer = {
    params: [createTimeRangeBrush({ timeAxis: 'x' })],
    mark: buildMarkConfig(styles, 'line'),
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
  layers.push(
    ...createCrosshairLayers(
      {
        x: {
          name: dateField ?? '',
          type: 'temporal',
          title: dateName ?? '',
          format: getTooltipFormat(transformedData, dateField),
        },
        y: {
          name: metricField ?? '',
          type: 'quantitative',
          title: metricName ?? '',
        },
      },
      { showTooltip }
    )
  );

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  // Apply time range to main layer's scale if enabled
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
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  const yAxisMapping = axisColumnMappings?.[AxisRole.Y];
  const xAxisMapping = axisColumnMappings?.[AxisRole.X];
  const secondYAxisMapping = axisColumnMappings?.[AxisRole.Y_SECOND];

  const xAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.X);
  const yAxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.Y);
  const y2AxisStyle = getAxisByRole(styles.standardAxes ?? [], AxisRole.Y_SECOND);

  const metric1Field = yAxisMapping?.column;
  const metric2Field = secondYAxisMapping?.column;
  const dateField = xAxisMapping?.column;
  const metric1Name = yAxisStyle?.title?.text || yAxisMapping?.name;
  const metric2Name = y2AxisStyle?.title?.text || secondYAxisMapping?.name;
  const dateName = xAxisStyle?.title?.text || xAxisMapping?.name;
  const layers: any[] = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

    const timeField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis;
    const value2Field = axisColumnMappings?.[AxisRole.Y_SECOND];

    if (!timeField || !valueField || !value2Field) {
      throw Error('Missing axis config or color field for line-bar chart');
    }

    const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

    const result = pipe(
      transform(sortByTime(axisColumnMappings?.x?.column), convertTo2DArray(allColumns)),
      createBaseConfig({
        title: `${valueField.name} (Bar) and ${value2Field.name} (Line) Over Time`,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      applyTimeRange,
      createLineBarSeries({ styles, categoryField: timeField, value2Field, valueField }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
      timeRange,
    });

    return result.spec;
  }

  const barLayer = {
    params: [createTimeRangeBrush({ timeAxis: 'x' })],
    mark: buildMarkConfig(styles, 'bar'),
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
        field: metric1Field,
        type: 'quantitative',
        axis: applyAxisStyling(
          { title: '' },
          yAxisStyle,
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
              title: styles.legendTitle,
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(showTooltip && {
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
            title: '',
            orient: Positions.RIGHT,
          },
          y2AxisStyle,
          'value',
          numericalColumns,
          [],
          dateColumns,
          ValueAxisPosition.Right // Second value axis which is on the right
        ),
        // scale: { zero: false },
      },
      color: {
        datum: metric2Name,
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition,
            }
          : null,
      },
      ...(showTooltip && {
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
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    barWithThresholdLayer.layer.push(thresholdLayer);
  }

  layers.push(barWithThresholdLayer, lineLayer);

  layers.push(
    ...createHighlightBarLayers(
      {
        x: {
          name: dateField ?? '',
          type: 'temporal',
          title: dateName,
        },
        y: {
          name: metric1Field ?? '',
          type: 'quantitative',
          title: metric1Name,
        },
        y1: {
          name: metric2Field ?? '',
          type: 'quantitative',
          title: metric2Name,
        },
      },
      { showTooltip }
    )
  );

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  // Apply time range to bar layer's scale if enabled
  if (styles.showFullTimeRange) {
    applyTimeRangeToEncoding(barLayer.encoding, axisColumnMappings, timeRange);
  }

  return {
    $schema: VEGASCHEMA,
    params: [...(dateField ? [createTimeRangeUpdater()] : [])],
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
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const timeField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;
    const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorColumn?.column;

    if (!timeField || !valueField || !colorField) {
      throw Error('Missing axis config or color field for multi lines chart');
    }

    const result = pipe(
      transform(
        sortByTime(timeField),
        pivot({
          groupBy: timeField,
          pivot: colorField,
          field: valueField,
        }),
        flatten(),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisConfig.yAxis?.name} Over Time by ${
          axisColumnMappings?.[AxisRole.COLOR]?.name
        }`,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      applyTimeRange,
      createLineSeries({
        styles,
        categoryField: timeField,
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
      timeRange,
    });

    return result.spec;
  }

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
    mark: buildMarkConfig(styles, 'line'),
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
        legend:
          styles?.addLegend !== false
            ? {
                title: styles.legendTitle,
                orient: styles?.legendPosition || Positions.RIGHT,
              }
            : null,
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
          { field: categoryField, type: 'nominal', title: categoryName },
        ],
      }),
    },
  };

  layers.push(mainLayer);
  layers.push(
    ...createCrosshairLayers(
      {
        x: {
          name: dateField ?? '',
          type: 'temporal',
          title: dateName ?? '',
          format: getTooltipFormat(transformedData, dateField),
        },
        y: {
          name: metricField ?? '',
          type: 'quantitative',
          title: metricName ?? '',
        },
        color: {
          name: categoryField ?? '',
          type: 'nominal',
          title: categoryName ?? '',
        },
      },
      { showTooltip, data: transformedData }
    )
  );

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  // Add time marker layer if enabled
  const timeMarkerLayer = createTimeMarkerLayer(styles);
  if (timeMarkerLayer) {
    layers.push(timeMarkerLayer);
  }

  // Apply time range to main layer's scale if enabled
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
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings,
  timeRange?: { from: string; to: string }
): any => {
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const timeField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;
    const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorColumn?.column;

    const facetColumn = axisColumnMappings?.[AxisRole.FACET]?.column;
    if (!timeField || !valueField || !colorField || !facetColumn) {
      throw Error('Missing axis config for facet time line chart');
    }

    const result = pipe(
      facetTransform(
        facetColumn,
        sortByTime(timeField),
        pivot({
          groupBy: timeField,
          pivot: colorField,
          field: valueField,
        }),
        flatten(),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisConfig.yAxis?.name} Over Time by ${
          axisColumnMappings?.[AxisRole.COLOR]?.name
        } (Faceted by ${axisColumnMappings?.[AxisRole.FACET]?.name})`,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      applyTimeRange,
      createFacetLineSeries({
        styles,
        categoryField: timeField,
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
      timeRange,
    });

    return result.spec;
  }

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

  // Create a mark config for the faceted spec
  const facetMarkConfig = buildMarkConfig(styles, 'line');

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
      legend:
        styles?.addLegend !== false
          ? {
              title: styles.legendTitle,
              orient: styles?.legendPosition || Positions.RIGHT,
            }
          : null,
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
        { field: category1Field, type: 'nominal', title: category1Name },
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
          mark: facetMarkConfig,
          params: [createTimeRangeBrush({ timeAxis: 'x' })],
          encoding: mainLayerEncoding,
        },
        ...createCrosshairLayers(
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
            color: {
              name: category1Field ?? '',
              type: 'nominal',
              title: category1Name,
            },
          },
          { showTooltip, data: transformedData }
        ),
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
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

    const categoryField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;

    if (!valueField || !categoryField) throw Error('Missing axis config for line chart');

    const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];
    // When axesMapping is updated but the data itself has not changed
    // (for example, when switching x axis to a different field),
    // the previous chart styles will be preserved.
    // This is the critical minimal fix:
    // for category-based line charts, simply set addTimeMarker to false
    // to prevent crashes when switching from date-based(enable addTimeMarker) to category-based.
    const result = pipe(
      transform(convertTo2DArray(allColumns)),
      createBaseConfig({
        title: `${axisConfig.yAxis?.name} by ${axisConfig.xAxis?.name}`,
        legend: { show: false },
      }),
      buildAxisConfigs,
      createLineSeries({
        styles,
        categoryField,
        seriesFields: [valueField],
        addTimeMarker: false,
      }),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
    });

    return result.spec;
  }
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const metricField = yAxis?.column;
  const categoryField = xAxis?.column;
  const metricName = yAxisStyle?.title?.text || yAxis?.name;
  const categoryName = xAxisStyle?.title?.text || xAxis?.name;
  const layers: any[] = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

  const mainLayer = {
    mark: buildMarkConfig(styles, 'line'),
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
      ...(showTooltip && {
        tooltip: [
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: metricField, type: 'quantitative', title: metricName },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  layers.push(
    ...createHighlightBarLayers(
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
      { showTooltip }
    )
  );

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
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

export const createCategoryMultiLineChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styles: LineChartStyle,
  axisColumnMappings?: AxisColumnMappings
): any => {
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const cateField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;
    const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorColumn?.column;

    if (!cateField || !valueField || !colorField) {
      throw Error('Missing axis config or color field for multi lines chart');
    }
    const result = pipe(
      transform(
        pivot({
          groupBy: cateField,
          pivot: colorField,
          field: valueField,
        }),
        flatten(),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisConfig.yAxis?.name} by ${axisConfig.xAxis?.name} and ${
          axisColumnMappings?.[AxisRole.COLOR]?.name
        }`,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      createLineSeries({
        styles,
        categoryField: cateField,
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== cateField),
        addTimeMarker: false,
      }),

      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig,
      axisColumnMappings: axisColumnMappings ?? {},
    });

    return result.spec;
  }
  const colorAxisColumn = axisColumnMappings?.[AxisRole.COLOR];
  const { xAxis, xAxisStyle, yAxis, yAxisStyle } = getSwappedAxisRole(styles, axisColumnMappings);

  const metricField = yAxis?.column;
  const categoryField = xAxis?.column;
  const categoryField2 = colorAxisColumn?.column;
  const metricName = yAxis?.name;
  const categoryName = xAxis?.name;
  const category2Name = colorAxisColumn?.name;
  const layers: any[] = [];
  const showTooltip = styles.tooltipOptions?.mode !== 'hidden';

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
          { title: metricName },
          yAxisStyle,
          'value',
          numericalColumns,
          categoricalColumns,
          dateColumns
        ),
      },
      color: {
        field: categoryField2,
        type: 'nominal',
        legend: styles.addLegend
          ? {
              title: styles.legendTitle,
              orient: styles.legendPosition?.toLowerCase() || Positions.RIGHT,
            }
          : null,
      },
      ...(showTooltip && {
        tooltip: [
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: metricField, type: 'quantitative', title: metricName },
          { field: categoryField2, type: 'nominal', title: category2Name },
        ],
      }),
    },
  };

  layers.push(mainLayer);

  layers.push(
    ...createCrosshairLayers(
      {
        x: {
          name: categoryField ?? '',
          type: 'nominal',
          title: categoryName ?? '',
        },
        y: {
          name: metricField ?? '',
          type: 'quantitative',
          title: metricName ?? '',
        },
        color: {
          name: categoryField2 ?? '',
          type: 'nominal',
          title: category2Name ?? '',
        },
      },
      { showTooltip, data: transformedData }
    )
  );

  // Add threshold layer if enabled
  const thresholdLayer = createThresholdLayer(styles?.thresholdOptions);
  if (thresholdLayer) {
    layers.push(thresholdLayer);
  }

  return {
    $schema: VEGASCHEMA,
    title: styles.titleOptions?.show
      ? styles.titleOptions?.titleName || `${metricName} by ${categoryName} and ${category2Name}`
      : undefined,
    data: { values: transformedData },
    layer: layers,
  };
};
