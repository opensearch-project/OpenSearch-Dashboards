/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildExpression,
  buildExpressionFunction,
  ExpressionFunctionOpenSearchDashboards,
  IExpressionLoaderParams,
} from '../../../../../expressions/public';

/**
 * Convert the visualization configuration to an expression
 * @param searchContext The search context
 * @param spec The vega spec object
 * @returns The expression string
 */
export const toExpression = (
  searchContext: IExpressionLoaderParams['searchContext'],
  spec: Record<string, any>
) => {
  if (!searchContext) {
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

  const vega = buildExpressionFunction<any>('vega', {
    spec: JSON.stringify(spec),
  });

  return buildExpression([opensearchDashboards, opensearchDashboardsContext, vega]).toString();
};
