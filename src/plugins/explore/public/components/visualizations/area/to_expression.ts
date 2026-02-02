/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChartStyle } from './area_vis_config';
import {
  VisColumn,
  VEGASCHEMA,
  AxisColumnMappings,
  AxisRole,
  TimeUnit,
  AggregationType,
} from '../types';
import { buildMarkConfig, createTimeMarkerLayer, applyAxisStyling } from '../line/line_chart_utils';
import { createThresholdLayer } from '../style_panel/threshold/threshold_utils';
import {
  applyTimeRangeToEncoding,
  getSwappedAxisRole,
  getTooltipFormat,
  getChartRender,
} from '../utils/utils';
import { DEFAULT_OPACITY } from '../constants';
import { createCrosshairLayers, createHighlightBarLayers } from '../utils/create_hover_state';
import { createTimeRangeBrush, createTimeRangeUpdater } from '../utils/time_range_brush';
import {
  pipe,
  createBaseConfig,
  buildAxisConfigs,
  assembleSpec,
  buildVisMap,
  applyTimeRange,
} from '../utils/echarts_spec';
import {
  createAreaSeries,
  createFacetAreaSeries,
  createCategoryAreaSeries,
  createStackAreaSeries,
  replaceNullWithZero,
} from './area_chart_utils';
import {
  convertTo2DArray,
  transform,
  sortByTime,
  pivot,
  facetTransform,
  aggregate,
} from '../utils/data_transformation';

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
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

    const timeField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;

    if (!valueField || !timeField) throw Error('Missing axis config for area chart');

    const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

    const result = pipe(
      transform(sortByTime(axisColumnMappings?.x?.column), convertTo2DArray(allColumns)),
      createBaseConfig({ title: `${axisConfig.yAxis?.name} Over Time`, legend: { show: false } }),
      buildAxisConfigs,
      applyTimeRange,
      createAreaSeries({
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
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const timeField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;
    const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorColumn?.column;

    if (!timeField || !valueField || !colorField) {
      throw Error('Missing axis config or color field for multi area chart');
    }
    const result = pipe(
      transform(
        sortByTime(timeField),
        pivot({
          groupBy: timeField,
          pivot: colorField,
          field: valueField,
          timeUnit: TimeUnit.SECOND,
          aggregationType: AggregationType.SUM,
        }),
        (data) => replaceNullWithZero(data, [timeField]),
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
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== timeField),
      }),
      createStackAreaSeries(styles),
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
 *
 * TODO: Improve chart styling and visual layout for better appearance
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
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);
    const timeField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;
    const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorColumn?.column;

    const facetColumn = axisColumnMappings?.[AxisRole.FACET]?.column;
    if (!timeField || !valueField || !colorField || !facetColumn) {
      throw Error('Missing axis config for facet area chart');
    }

    const result = pipe(
      facetTransform(
        facetColumn,
        sortByTime(timeField),
        pivot({
          groupBy: timeField,
          pivot: colorField,
          field: valueField,
          timeUnit: TimeUnit.SECOND,
          aggregationType: AggregationType.SUM,
        }),
        (data) => replaceNullWithZero(data, [timeField]),
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
      createFacetAreaSeries({
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
  if (getChartRender() === 'echarts') {
    const axisConfig = getSwappedAxisRole(styles, axisColumnMappings);

    const categoryField = axisConfig.xAxis?.column;
    const valueField = axisConfig.yAxis?.column;

    if (!valueField || !categoryField) throw Error('Missing axis config for area chart');

    const allColumns = [...Object.values(axisColumnMappings ?? {}).map((m) => m.column)];

    const result = pipe(
      transform(
        aggregate({
          groupBy: categoryField,
          field: valueField,
          aggregationType: AggregationType.SUM,
        }),
        convertTo2DArray(allColumns)
      ),
      createBaseConfig({
        title: `${axisConfig.yAxis?.name} by ${axisConfig.xAxis?.name}`,
        legend: { show: false },
      }),
      buildAxisConfigs,
      createCategoryAreaSeries({
        styles,
        categoryField,
        valueField,
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
  if (getChartRender() === 'echarts') {
    // Extract field mappings directly from axisColumnMappings
    const xAxis = axisColumnMappings?.[AxisRole.X];
    const yAxis = axisColumnMappings?.[AxisRole.Y];
    const colorMapping = axisColumnMappings?.[AxisRole.COLOR];
    const colorField = colorMapping?.column;

    if (!xAxis || !yAxis || !colorField) {
      throw Error('Missing axis config or color field for stacked area chart');
    }

    const categoryField = xAxis.column;
    const valueField = yAxis.column;

    const result = pipe(
      transform(
        pivot({
          groupBy: categoryField,
          pivot: colorField,
          field: valueField,
          aggregationType: AggregationType.SUM,
        }),
        (data) => replaceNullWithZero(data, [categoryField]),
        convertTo2DArray()
      ),
      createBaseConfig({
        title: `${axisColumnMappings?.y?.name} by ${axisColumnMappings?.x?.name} and ${colorMapping.name}`,
        legend: { show: styles.addLegend },
      }),
      buildAxisConfigs,
      buildVisMap({
        seriesFields: (headers) => (headers ?? []).filter((h) => h !== categoryField),
      }),
      createStackAreaSeries(styles),
      assembleSpec
    )({
      data: transformedData,
      styles,
      axisConfig: { xAxis, yAxis },
      axisColumnMappings: axisColumnMappings ?? {},
    });

    return result.spec;
  }

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
