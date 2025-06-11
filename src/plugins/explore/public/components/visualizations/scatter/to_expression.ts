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
import { ScatterChartStyleControls, defaultScatterChartStyles } from './scatter_vis_config';
import { DiscoverVisColumn } from '../types';
import { applyAxisStyling, getAxisByRole } from '../utils/utils';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  indexPattern: IndexPattern,
  transformedData: Array<Record<string, any>>,
  numericalColumns: DiscoverVisColumn[],
  categoricalColumns: DiscoverVisColumn[],
  dateColumns: DiscoverVisColumn[],
  styleOptions: Partial<ScatterChartStyleControls>
) => {
  if (!indexPattern || !searchContext) {
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

  const vegaSpec = createVegaScatterSpec(
    indexPattern,
    transformedData,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    styleOptions
  );

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(vegaSpec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};

const createVegaScatterSpec = (
  indexPattern?: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<ScatterChartStyleControls>
) => {
  if (!transformedData || transformedData.length === 0) {
    return null;
  }

  // Get column counts
  const numMetrics = numericalColumns?.length || 0;
  const numCategories = categoricalColumns?.length || 0;

  const numericFields = numericalColumns?.map((item) => item.column);
  const categoryFields = categoricalColumns?.map((item) => item.column);
  const categoryNames = categoricalColumns?.map((item) => item.name);

  const styles = { ...defaultScatterChartStyles, ...styleOptions };
  let baseSpec: any;

  if (numMetrics === 2 && numCategories === 0) {
    const xAxis = getAxisByRole(styleOptions?.StandardAxes ?? [], 'x');
    const yAxis = getAxisByRole(styleOptions?.StandardAxes ?? [], 'y');
    const markLayer = {
      mark: {
        type: 'point',
        tooltip: styles.addTooltip,
        shape: styles.exclusive.pointShape,
        angle: styles.exclusive.angle,
        filled: styles.exclusive.filled,
      },
      encoding: {
        x: {
          field: xAxis?.field?.default.column,
          type: 'quantitative',
          axis: applyAxisStyling(xAxis),
        },
        y: {
          field: yAxis?.field?.default.column,
          type: 'quantitative',
          axis: applyAxisStyling(yAxis),
        },
      },
    };

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      autosize: { type: 'fit', contains: 'padding' },
      data: { values: transformedData },
      layer: [markLayer].filter(Boolean),
    };
  }

  if (numMetrics === 2 && numCategories === 1) {
    const xAxis = getAxisByRole(styleOptions?.StandardAxes ?? [], 'x');
    const yAxis = getAxisByRole(styleOptions?.StandardAxes ?? [], 'y');
    const markLayer = {
      mark: {
        type: 'point',
        tooltip: styles.addTooltip,
        shape: styles.exclusive.pointShape,
        angle: styles.exclusive.angle,
        filled: styles.exclusive.filled,
      },
      encoding: {
        x: {
          field: xAxis?.field?.default.column,
          type: 'quantitative',
          axis: applyAxisStyling(xAxis),
        },
        y: {
          field: yAxis?.field?.default.column,
          type: 'quantitative',
          axis: applyAxisStyling(yAxis),
        },
        color: {
          field: categoryFields![0],
          type: 'nominal',
          legend: styleOptions?.addLegend
            ? {
                title: categoryNames![0] || 'Metrics',
                orient: styleOptions?.legendPosition,
                symbolLimit: 10,
              }
            : null,
        },
      },
    };

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      autosize: { type: 'fit', contains: 'padding' },
      data: { values: transformedData },
      layer: [markLayer].filter(Boolean),
    };
  }
  if (numMetrics === 3 && numCategories === 1) {
    const xAxis = getAxisByRole(styleOptions?.StandardAxes ?? [], 'x');
    const yAxis = getAxisByRole(styleOptions?.StandardAxes ?? [], 'y');
    const numericalSize = numericalColumns?.filter(
      (f) => f.column !== xAxis?.field?.default.column && f.column !== yAxis?.field?.default.column
    )[0];
    const markLayer = {
      mark: {
        type: 'point',
        tooltip: styles.addTooltip,
        shape: styles.exclusive.pointShape,
        angle: styles.exclusive.angle,
        filled: styles.exclusive.filled,
      },
      encoding: {
        x: {
          field: xAxis?.field?.default.column,
          type: 'quantitative',
          axis: applyAxisStyling(xAxis),
        },
        y: {
          field: yAxis?.field?.default.column,
          type: 'quantitative',
          axis: applyAxisStyling(yAxis),
        },
        color: {
          field: categoryFields![0],
          type: 'nominal',
          legend: styleOptions?.addLegend
            ? {
                title: categoryNames![0] || 'Metrics',
                orient: styleOptions?.legendPosition,
                symbolLimit: 10,
              }
            : null,
        },
        size: {
          field: numericalSize?.column,
          type: 'quantitative',
          legend: styleOptions?.addLegend
            ? {
                title: numericalSize?.name || 'Metrics',
                orient: styleOptions?.legendPosition,
                symbolLimit: 10,
              }
            : null,
        },
      },
    };

    baseSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      autosize: { type: 'fit', contains: 'padding' },
      data: { values: transformedData },
      layer: [markLayer].filter(Boolean),
    };
  }

  return baseSpec;
};
