/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
} from '../../../../../../../../../expressions/public';
import { IndexPattern } from '../../../../../../../../../data/public';
import { DiscoverViewServices } from '../../../../build_services';
import { LineChartStyleControls } from './line_vis_config';
import { ExploreVisColumn } from '../types';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: ExploreVisColumn[],
  categoricalColumns?: ExploreVisColumn[],
  dateColumns?: ExploreVisColumn[],
  styleOptions?: Partial<LineChartStyleControls>
) => {
  if (
    !indexPattern ||
    !searchContext ||
    !JSON.stringify(searchContext.query).toLowerCase().includes('stats') // Empty visualization if query is not aggregated
  ) {
    return '';
  }

  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );
  const opensearchDashboardsContext = buildExpressionFunction('opensearch_dashboards_context', {
    timeRange: JSON.stringify(searchContext.timeRange || {}),
    filters: JSON.stringify(searchContext.filters || []),
    query: JSON.stringify(searchContext.query || []),
  });

  const vegaSpec = createVegaLineSpec(
    indexPattern,
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions,
    searchContext
  );

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

// Helper function to get stroke dash array for different line styles
const getStrokeDash = (style: string): number[] | undefined => {
  switch (style) {
    case 'dashed':
      return [5, 5];
    case 'dot-dashed':
      return [5, 5, 1, 5];
    case 'full':
    default:
      return undefined;
  }
};

// Helper function to create threshold line layer
const createThresholdLayer = (styles: Partial<LineChartStyleControls> | undefined): any => {
  if (!styles?.thresholdLine?.show) {
    return null;
  }

  const thresholdLayer: any = {
    mark: {
      type: 'rule',
      color: styles.thresholdLine.color,
      strokeWidth: styles.thresholdLine.width,
      strokeDash: getStrokeDash(styles.thresholdLine.style),
      tooltip: styles.addTooltip !== false,
    },
    encoding: {
      y: {
        datum: styles.thresholdLine.value,
        type: 'quantitative',
      },
    },
  };

  // Add tooltip content if enabled
  if (styles.addTooltip !== false) {
    thresholdLayer.encoding.tooltip = {
      value: `Threshold: ${styles.thresholdLine.value}`,
    };
  }

  return thresholdLayer;
};

// Helper function to create time marker layer
const createTimeMarkerLayer = (styles: Partial<LineChartStyleControls> | undefined): any => {
  if (!styles?.addTimeMarker) {
    return null;
  }

  return {
    mark: {
      type: 'rule',
      color: '#FF6B6B',
      strokeWidth: 2,
      strokeDash: [3, 3],
      tooltip: styles.addTooltip !== false,
    },
    encoding: {
      x: {
        datum: { expr: 'now()' },
        type: 'temporal',
      },
      ...(styles.addTooltip !== false && {
        tooltip: {
          value: 'Current Time',
        },
      }),
    },
  };
};

// Helper function to get Vega interpolation from UI lineMode
const getVegaInterpolation = (lineMode: string): string => {
  switch (lineMode) {
    case 'straight':
      return 'linear';
    case 'smooth':
      return 'monotone';
    case 'stepped':
      return 'step-after';
    default:
      return 'monotone';
  }
};

// Fixed function to build proper Vega-Lite mark configuration
const buildMarkConfig = (
  styles: Partial<LineChartStyleControls> | undefined,
  markType: 'line' | 'bar' = 'line'
): any => {
  // Default values - handle undefined styles object
  const showLine = styles?.showLine !== false;
  const showDots = styles?.showDots !== false;
  const lineWidth = styles?.lineWidth ?? 2;
  const lineMode = styles?.lineMode ?? 'smooth';
  const addTooltip = styles?.addTooltip !== false;

  if (markType === 'bar') {
    return {
      type: 'bar',
      opacity: 0.7,
      tooltip: addTooltip,
    };
  }

  // For line charts
  if (!showLine && showDots) {
    // Only show points
    return {
      type: 'point',
      tooltip: addTooltip,
      size: 100,
    };
  } else if (showLine && !showDots) {
    // Only show line
    return {
      type: 'line',
      tooltip: addTooltip,
      strokeWidth: lineWidth,
      interpolate: getVegaInterpolation(lineMode),
    };
  } else if (showLine && showDots) {
    // Show both line and points
    return {
      type: 'line',
      point: true,
      tooltip: addTooltip,
      strokeWidth: lineWidth,
      interpolate: getVegaInterpolation(lineMode),
    };
  } else {
    // Neither line nor dots - fallback to points
    return {
      type: 'point',
      tooltip: addTooltip,
      size: 0, // Make points invisible
    };
  }
};

// Helper function to apply grid and axis styling
const applyAxisStyling = (
  axis: any,
  styles: Partial<LineChartStyleControls> | undefined,
  axisType: 'category' | 'value',
  numericalColumns?: ExploreVisColumn[],
  categoricalColumns?: ExploreVisColumn[],
  dateColumns?: ExploreVisColumn[]
): any => {
  const gridEnabled =
    axisType === 'category'
      ? styles?.grid?.categoryLines ?? true
      : styles?.grid?.valueLines ?? true;

  // Get the axis configuration from styles
  const axisConfig = axisType === 'category' ? styles?.categoryAxes?.[0] : styles?.valueAxes?.[0];

  if (!axisConfig) {
    // Fallback to basic styling if no config found
    return {
      ...axis,
      grid: gridEnabled,
      gridColor: '#E0E0E0',
      gridOpacity: 0.5,
    };
  }

  // Build the complete axis configuration
  const fullAxisConfig: any = {
    ...axis,
    // Grid settings
    grid: gridEnabled,
    gridColor: '#E0E0E0',
    gridOpacity: 0.5,
  };

  // Apply axis visibility
  if (!axisConfig.show) {
    fullAxisConfig.labels = false;
    fullAxisConfig.ticks = false;
    fullAxisConfig.domain = false;
    return fullAxisConfig;
  }

  // Apply position
  if (axisConfig.position) {
    fullAxisConfig.orient = axisConfig.position;
  }

  // Apply label settings
  if (axisConfig.labels) {
    if (!axisConfig.labels.show) {
      fullAxisConfig.labels = false;
    } else {
      fullAxisConfig.labels = {};

      // Apply label rotation/alignment
      if (axisConfig.labels.rotate !== undefined) {
        fullAxisConfig.labelAngle = axisConfig.labels.rotate;
      }

      // Apply label truncation
      if (axisConfig.labels.truncate !== undefined && axisConfig.labels.truncate > 0) {
        fullAxisConfig.labelLimit = axisConfig.labels.truncate;
      }

      // Apply label filtering (this controls overlapping labels)
      if (axisConfig.labels.filter !== undefined) {
        fullAxisConfig.labelOverlap = axisConfig.labels.filter ? 'greedy' : false;
      }
    }
  }

  // Apply title settings
  let titleText = '';
  if (axisConfig?.title?.text && axisConfig.title.text.trim() !== '') {
    // User has explicitly set a title
    titleText = axisConfig.title.text;
  } else {
    // Use smart default based on data
    if (axisType === 'category') {
      if (dateColumns?.length) {
        titleText = dateColumns[0].name;
      } else if (categoricalColumns?.length) {
        titleText = categoricalColumns[0].name;
      } else {
        titleText = 'Category';
      }
    } else {
      // value axis
      if (numericalColumns?.length) {
        titleText = numericalColumns[0].name;
      } else {
        titleText = 'Metric';
      }
    }
  }

  if (titleText) {
    fullAxisConfig.title = titleText;
  }

  return fullAxisConfig;
};

// Enhanced function with all new styling controls
const createVegaLineSpec = (
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: ExploreVisColumn[],
  categoricalColumns?: ExploreVisColumn[],
  dateColumns?: ExploreVisColumn[],
  styleOptions?: Partial<LineChartStyleControls>,
  searchContext?: IExpressionLoaderParams['searchContext']
) => {
  // Validate inputs
  if (!transformedData || transformedData.length === 0) {
    return null;
  }

  // Get column counts
  const numMetrics = numericalColumns?.length || 0;
  const numCategories = categoricalColumns?.length || 0;
  const numDates = dateColumns?.length || 0;

  const styles = { ...styleOptions };

  let baseSpec: any;
  const layers: any[] = [];

  // Rule 1: 1 Metric & 1 Date → Line Chart
  if (numMetrics === 1 && numDates === 1 && numCategories === 0) {
    const metricField = numericalColumns![0].column;
    const dateField = dateColumns![0].column;
    const metricName = numericalColumns![0].name;
    const dateName = dateColumns![0].name;

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

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metricName} Over Time`,
      data: { values: transformedData },
      layer: layers,
    };
  }

  // Rule 2: 2 Metrics & 1 Date → Line + Bar Chart
  else if (numMetrics === 2 && numDates === 1 && numCategories === 0) {
    const metric1Field = numericalColumns![0].column;
    const metric2Field = numericalColumns![1].column;
    const dateField = dateColumns![0].column;
    const metric1Name = numericalColumns![0].name;
    const metric2Name = numericalColumns![1].name;
    const dateName = dateColumns![0].name;

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
            categoricalColumns,
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
            categoricalColumns,
            dateColumns
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
              orient: 'right',
            },
            styles,
            'value'
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
    const thresholdLayer = createThresholdLayer(styles);
    if (thresholdLayer) {
      layers.push(thresholdLayer);
    }

    // Add time marker layer if enabled
    const timeMarkerLayer = createTimeMarkerLayer(styles);
    if (timeMarkerLayer) {
      layers.push(timeMarkerLayer);
    }

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metric1Name} (Bar) and ${metric2Name} (Line) Over Time`,
      data: { values: transformedData },
      layer: layers,
      resolve: {
        scale: { y: 'independent' },
      },
    };
  }

  // Rule 3: 1 Metric & 1 Date & 1 Categorical → Multi-line Chart
  else if (numMetrics === 1 && numDates === 1 && numCategories === 1) {
    const metricField = numericalColumns![0].column;
    const dateField = dateColumns![0].column;
    const categoryField = categoricalColumns![0].column;
    const metricName = numericalColumns![0].name;
    const dateName = dateColumns![0].name;
    const categoryName = categoricalColumns![0].name;

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
                  orient: styles?.legendPosition || 'right',
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

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metricName} Over Time by ${categoryName}`,
      data: { values: transformedData },
      layer: layers,
    };
  }

  // Rule 4: 1 Metric & 1 Date & 2 Categorical → Faceted Multi-line Chart
  else if (numMetrics === 1 && numDates === 1 && numCategories === 2) {
    const metricField = numericalColumns![0].column;
    const dateField = dateColumns![0].column;
    const category1Field = categoricalColumns![0].column;
    const category2Field = categoricalColumns![1].column;
    const metricName = numericalColumns![0].name;
    const dateName = dateColumns![0].name;
    const category1Name = categoricalColumns![0].name;
    const category2Name = categoricalColumns![1].name;

    // Create a mark config for the faceted spec
    const facetMarkConfig = buildMarkConfig(styles, 'line');

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: `${metricName} Over Time by ${category1Name} (Faceted by ${category2Name})`,
      data: { values: transformedData },
      facet: {
        field: category2Field,
        type: 'nominal',
        columns: 2,
        header: { title: category2Name },
      },
      spec: {
        width: 300,
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
                        orient: styles?.legendPosition || 'right',
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
  }

  // No matching rule found
  else {
    return null;
  }

  return baseSpec;
};
