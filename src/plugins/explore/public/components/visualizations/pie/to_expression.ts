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
import { PieChartStyleControls } from './pie_vis_config';
import { DiscoverVisColumn } from '../types';

export const toExpression = async (
  services: DiscoverViewServices,
  searchContext: IExpressionLoaderParams['searchContext'],
  indexPattern: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<PieChartStyleControls>
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

  const vegaSpec = createVegaPieSpec(
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

const createVegaPieSpec = (
  indexPattern?: IndexPattern,
  transformedData?: Array<Record<string, any>>,
  numericalColumns?: DiscoverVisColumn[],
  categoricalColumns?: DiscoverVisColumn[],
  dateColumns?: DiscoverVisColumn[],
  styleOptions?: Partial<PieChartStyleControls>
) => {
  if (!transformedData || transformedData.length === 0) {
    return null;
  }
  const numericFields = numericalColumns?.map((item) => item.column)[0];
  const numericNames = numericalColumns?.map((item) => item.name)[0];
  const categoryField = categoricalColumns?.map((item) => item.column)[0];

  const encodingBase = {
    theta: {
      field: numericFields,
      type: 'quantitative',
      stack: true,
    },
    color: {
      field: categoryField,
      type: 'nominal',
      legend: styleOptions?.addLegend
        ? { title: numericNames, orient: styleOptions?.legendPosition, symbolLimit: 10 }
        : null,
    },
  };

  const markLayer = {
    mark: {
      type: 'arc',
      innerRadius: styleOptions?.exclusive?.donut ? 30 : 0,
      radius: 130,
      tooltip: styleOptions?.addTooltip,
    },
  };

  const labelLayer = {
    mark: {
      type: 'text',
      limit: styleOptions?.exclusive?.truncate ? styleOptions?.exclusive?.truncate : 100,
      radius: 180,
    },
    encoding: {
      text: {
        field: categoryField,
        type: 'nominal',
      },
    },
  };

  const valueLayer = {
    mark: {
      type: 'text',
      limit: 100,
      radius: 150,
    },
    encoding: {
      text: {
        field: numericFields,
        type: 'nominal',
      },
    },
  };

  const baseSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    autosize: { type: 'fit', contains: 'padding' },
    data: { values: transformedData },
    layer: [
      markLayer,
      styleOptions?.exclusive?.showLabels ? labelLayer : null,
      styleOptions?.exclusive?.showValues ? valueLayer : null,
    ].filter(Boolean),
    encoding: encodingBase,
    config: {
      axis: {
        labelFont: 'sans-serif',
        titleFont: 'sans-serif',
      },
      legend: {
        labelFont: 'sans-serif',
        titleFont: 'sans-serif',
      },
    },
  };

  return baseSpec;
};
