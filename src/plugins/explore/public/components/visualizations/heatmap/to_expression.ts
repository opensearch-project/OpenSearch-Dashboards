/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { VisColumn, ScaleType } from '../types';
import { defaultHeatmapChartStyles } from './heatmap_vis_config';
import { applyAxisStyling, getAxisByRole } from '../utils/utils';
import { createlabelLayer, enhanceStyle, addTransform } from './heatmap_chart_utils';

// export const toExpression = async (
//   services: DiscoverViewServices,
//   searchContext: IExpressionLoaderParams['searchContext'],
//   indexPattern: IndexPattern,
//   transformedData: Array<Record<string, any>>,
//   numericalColumns: VisColumn[],
//   categoricalColumns: VisColumn[],
//   dateColumns: VisColumn[],
//   styleOptions: Partial<HeatmapChartStyleControls>
// ) => {
//   if (!indexPattern || !searchContext) {
//     return '';
//   }

//   const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
//     'opensearchDashboards',
//     {}
//   );
//   const opensearchDashboardsContext = buildExpressionFunction('opensearch_dashboards_context', {
//     timeRange: JSON.stringify(searchContext.timeRange || {}),
//     filters: JSON.stringify(searchContext.filters || []),
//     query: JSON.stringify(searchContext.query || []),
//   });

//   const vegaSpec = createVegaHeatmapSpec(
//     indexPattern,
//     transformedData,
//     numericalColumns,
//     categoricalColumns,
//     dateColumns,
//     styleOptions
//   );

//   const vega = buildExpressionFunction<any>('vega', {
//     spec: JSON.stringify(vegaSpec),
//   });

//   return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
// };

export const createHeatmapChart = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: Partial<HeatmapChartStyleControls>
) => {
  if (!transformedData || transformedData.length === 0) {
    return null;
  }

  // Get column counts
  const numMetrics = numericalColumns?.length || 0;
  const numCategories = categoricalColumns?.length || 0;

  const styles = { ...defaultHeatmapChartStyles, ...styleOptions };
  let baseSpec: any;

  if (numMetrics === 1 && numCategories === 2) {
    const xAxis = getAxisByRole(styles?.StandardAxes ?? [], 'x');
    const yAxis = getAxisByRole(styles?.StandardAxes ?? [], 'y');

    const numericalColor = numericalColumns![0];
    const markLayer: any = {
      mark: {
        type: 'rect',
        tooltip: styles.addTooltip,
        stroke: 'white',
        strokeWidth: 1,
      },
      encoding: {
        x: {
          field: xAxis?.field?.default.column,
          type: 'nominal',
          axis: applyAxisStyling(xAxis),
        },
        y: {
          field: yAxis?.field?.default.column,
          type: 'nominal',
          axis: applyAxisStyling(yAxis),
        },
        color: {
          field: numericalColor.column,
          type: 'quantitative',
          // Todo:  log doesn't support bin, delete or replace
          bin:
            !styles.exclusive?.useCustomRanges && styles.exclusive.colorScaleType !== ScaleType.LOG
              ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
              : false,
          scale: {
            type: styles.exclusive.colorScaleType,
            scheme: styles.exclusive?.colorSchema,
            reverse: styles.exclusive?.reverseSchema,
          },
          legend: styles.addLegend
            ? {
                title: numericalColor.name || 'Metrics',
                orient: styles.legendPosition,
              }
            : null,
        },
      },
    };

    enhanceStyle(markLayer, styles, transformedData, numericalColor.column);

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      autosize: { type: 'fit', contains: 'padding' },
      data: { values: transformedData },
      transform: addTransform(styles, numericalColor.column),
      layer: [
        markLayer,
        createlabelLayer(
          styles,
          true,
          xAxis?.field?.default,
          yAxis?.field?.default,
          numericalColor.column
        ),
      ].filter(Boolean),
    };
  }

  if (numMetrics === 3) {
    const xAxis = getAxisByRole(styles?.StandardAxes ?? [], 'x');
    const yAxis = getAxisByRole(styles?.StandardAxes ?? [], 'y');

    const numericalColor = numericalColumns?.filter(
      (f) => f.column !== xAxis?.field?.default.column && f.column !== yAxis?.field?.default.column
    )[0];

    const markLayer: any = {
      mark: {
        type: 'rect',
        tooltip: styles.addTooltip,
        stroke: 'white',
        strokeWidth: 1,
      },
      encoding: {
        x: {
          field: xAxis?.field?.default.column,
          type: 'quantitative',
          bin: true,
          axis: applyAxisStyling(xAxis),
        },
        y: {
          field: yAxis?.field?.default.column,
          type: 'quantitative',
          bin: true,
          axis: applyAxisStyling(yAxis),
        },
        color: {
          field: numericalColor.column,
          type: 'quantitative',
          bin: !styles.exclusive?.useCustomRanges
            ? { maxbins: Number(styles.exclusive?.maxNumberOfColors) }
            : false,
          scale: {
            type: styles.exclusive.colorScaleType,
            scheme: styles.exclusive?.colorSchema,
            reverse: styles.exclusive?.reverseSchema,
          },
          legend: styles.addLegend
            ? {
                title: numericalColor.name || 'Metrics',
                orient: styles.legendPosition,
              }
            : null,
        },
      },
    };

    enhanceStyle(markLayer, styles, transformedData, numericalColor.column);

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      autosize: { type: 'fit', contains: 'padding' },
      data: { values: transformedData },
      transform: addTransform(styles, numericalColor.column),
      layer: [
        markLayer,
        createlabelLayer(
          styles,
          false,
          xAxis?.field?.default,
          yAxis?.field?.default,
          numericalColor.column
        ),
      ].filter(Boolean),
    };
  }

  return baseSpec;
};
