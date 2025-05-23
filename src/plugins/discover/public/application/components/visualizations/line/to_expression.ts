/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
} from '../../../../../../expressions/public';
import { IndexPattern } from '../../../../../../data/public';
import { DiscoverViewServices } from '../../../../build_services';
import { LineChartStyleControls } from './line_vis_config';
import { DiscoverVisColumn } from '../types';
import { Positions } from '../utils/collections';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
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
const createThresholdLayer = (
  styles: LineChartStyleControls,
  dateField?: string,
  metricField?: string
): any => {
  if (!styles.thresholdLine?.show) {
    return null;
  }

  const thresholdLayer: any = {
    mark: {
      type: 'rule',
      color: styles.thresholdLine.color,
      strokeWidth: styles.thresholdLine.width,
      strokeDash: getStrokeDash(styles.thresholdLine.style),
      tooltip: styles.addTooltip,
    },
    encoding: {
      y: {
        datum: styles.thresholdLine.value,
        type: 'quantitative',
      },
    },
  };

  // Add tooltip content if enabled
  if (styles.addTooltip) {
    thresholdLayer.encoding.tooltip = {
      value: `Threshold: ${styles.thresholdLine.value}`,
    };
  }

  return thresholdLayer;
};

// Helper function to create time marker layer
const createTimeMarkerLayer = (styles: LineChartStyleControls, dateField: string): any => {
  if (!styles.addTimeMarker) {
    return null;
  }

  return {
    mark: {
      type: 'rule',
      color: '#FF6B6B',
      strokeWidth: 2,
      strokeDash: [3, 3],
      tooltip: styles.addTooltip,
    },
    encoding: {
      x: {
        datum: { expr: 'now()' },
        type: 'temporal',
      },
    },
    ...(styles.addTooltip && {
      encoding: {
        ...{
          x: {
            datum: { expr: 'now()' },
            type: 'temporal',
          },
        },
        tooltip: {
          value: 'Current Time',
        },
      },
    }),
  };
};

// Helper function to apply grid and axis styling
const applyAxisStyling = (axis: any, styles: LineChartStyleControls): any => {
  return {
    ...axis,
    grid: styles.grid?.categoryLines ?? true,
    gridColor: '#E0E0E0',
    gridOpacity: 0.5,
  };
};

// Enhanced function with all new styling controls
const createVegaLineSpec = (
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
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

  // Apply complete default style options using the interface
  const defaultStyles: LineChartStyleControls = {
    addTooltip: true,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    addTimeMarker: false,
    thresholdLine: {
      color: '#E7664C',
      show: false,
      style: 'full',
      value: 10,
      width: 1,
    },
    grid: {
      categoryLines: true,
      valueLines: true,
    },
    categoryAxes: [
      {
        id: 'CategoryAxis-1',
        type: 'category',
        position: 'bottom',
        show: true,
        style: {},
        scale: {
          type: 'linear',
        },
        labels: {
          show: true,
          filter: true,
          rotate: 0,
          truncate: 100,
        },
        title: {},
      },
    ],
    valueAxes: [
      {
        id: 'ValueAxis-1',
        name: 'LeftAxis-1',
        type: 'value',
        position: 'left',
        show: true,
        style: {},
        scale: {
          type: 'linear',
          mode: 'normal',
          defaultYExtents: false,
          setYExtents: false,
        },
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: 'Count',
        },
      },
    ],
    seriesParams: [
      {
        show: true,
        type: 'line',
        mode: 'normal',
        data: {
          id: '1',
          label: 'Count',
        },
        valueAxis: 'ValueAxis-1',
        drawLinesBetweenPoints: true,
        lineWidth: 2,
        interpolate: 'linear',
        showCircles: true,
      },
    ],
    labels: {},
    dataConfig: {
      fieldConfigs: {},
      maxDataPoints: 1000,
      sampleSize: undefined,
      missingValueHandling: 'ignore',
    },
    times: [],
    type: 'line',
    orderBucketsBySum: true,
  };

  const styles = { ...defaultStyles, ...styleOptions };

  let baseSpec: any;
  const layers: any[] = [];

  // Rule 1: 1 Metric & 1 Date → Line Chart
  if (numMetrics === 1 && numDates === 1 && numCategories === 0) {
    const metricField = numericalColumns![0].column;
    const dateField = dateColumns![0].column;
    const metricName = numericalColumns![0].name;
    const dateName = dateColumns![0].name;

    const mainLayer = {
      mark: {
        type: 'line',
        point: true,
        tooltip: styles.addTooltip,
        strokeWidth: 2,
        interpolate: 'monotone',
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
            styles
          ),
        },
        y: {
          field: metricField,
          type: 'quantitative',
          axis: applyAxisStyling({ title: metricName }, styles),
        },
      },
    };

    layers.push(mainLayer);

    // Add threshold layer if enabled
    const thresholdLayer = createThresholdLayer(styles, dateField, metricField);
    if (thresholdLayer) {
      layers.push(thresholdLayer);
    }

    // Add time marker layer if enabled
    const timeMarkerLayer = createTimeMarkerLayer(styles, dateField);
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
      mark: {
        type: 'bar',
        opacity: 0.7,
        tooltip: styles.addTooltip,
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
            styles
          ),
        },
        y: {
          field: metric1Field,
          type: 'quantitative',
          axis: applyAxisStyling({ title: metric1Name }, styles),
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
      mark: {
        type: 'line',
        point: true,
        tooltip: styles.addTooltip,
        strokeWidth: 2,
        interpolate: 'monotone',
      },
      encoding: {
        x: {
          field: dateField,
          type: 'temporal',
        },
        y: {
          field: metric2Field,
          type: 'quantitative',
          axis: {
            title: metric2Name,
            orient: 'right',
            grid: styles.grid?.categoryLines ?? true,
          },
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
    const thresholdLayer = createThresholdLayer(styles, dateField, metric1Field);
    if (thresholdLayer) {
      layers.push(thresholdLayer);
    }

    // Add time marker layer if enabled
    const timeMarkerLayer = createTimeMarkerLayer(styles, dateField);
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
      mark: {
        type: 'line',
        point: true,
        tooltip: styles.addTooltip,
        strokeWidth: 2,
        interpolate: 'monotone',
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
            styles
          ),
        },
        y: {
          field: metricField,
          type: 'quantitative',
          axis: applyAxisStyling({ title: metricName }, styles),
        },
        color: {
          field: categoryField,
          type: 'nominal',
          legend: styles.addLegend
            ? {
                title: categoryName,
                orient: styles.legendPosition,
              }
            : null,
        },
      },
    };

    layers.push(mainLayer);

    // Add threshold layer if enabled
    const thresholdLayer = createThresholdLayer(styles, dateField, metricField);
    if (thresholdLayer) {
      layers.push(thresholdLayer);
    }

    // Add time marker layer if enabled
    const timeMarkerLayer = createTimeMarkerLayer(styles, dateField);
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
            mark: {
              type: 'line',
              point: true,
              tooltip: styles.addTooltip,
              strokeWidth: 2,
              interpolate: 'monotone',
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
                  styles
                ),
              },
              y: {
                field: metricField,
                type: 'quantitative',
                axis: applyAxisStyling({ title: metricName }, styles),
              },
              color: {
                field: category1Field,
                type: 'nominal',
                legend: styles.addLegend
                  ? {
                      title: category1Name,
                      orient: styles.legendPosition,
                    }
                  : null,
              },
            },
          },
          // Add threshold layer to each facet if enabled
          ...(styles.thresholdLine?.show
            ? [
                {
                  mark: {
                    type: 'rule',
                    color: styles.thresholdLine.color,
                    strokeWidth: styles.thresholdLine.width,
                    strokeDash: getStrokeDash(styles.thresholdLine.style),
                  },
                  encoding: {
                    y: {
                      datum: styles.thresholdLine.value,
                      type: 'quantitative',
                    },
                  },
                },
              ]
            : []),
          // Add time marker to each facet if enabled
          ...(styles.addTimeMarker
            ? [
                {
                  mark: {
                    type: 'rule',
                    color: '#FF6B6B',
                    strokeWidth: 2,
                    strokeDash: [3, 3],
                  },
                  encoding: {
                    x: {
                      datum: { expr: 'now()' },
                      type: 'temporal',
                    },
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
