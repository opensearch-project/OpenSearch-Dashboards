/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { OpenSearchaggsExpressionFunctionDefinition } from '../../../../data/public';
import { ExpressionFunctionOpenSearchDashboards } from '../../../../expressions';
import { buildExpressionFunction } from '../../../../expressions/public';
import { VisualizationState, StyleState } from '../../application/utils/state_management';
import { getSearchService, getIndexPatterns } from '../../plugin_services';
import { IExpressionLoaderParams } from '../../../../expressions/public';

export const getAggExpressionFunctions = async (
  visualization: VisualizationState,
  style?: StyleState,
  useVega: boolean = false,
  searchContext?: IExpressionLoaderParams['searchContext']
) => {
  const { activeVisualization, indexPattern: indexId = '' } = visualization;
  const { aggConfigParams } = activeVisualization || {};

  const indexPatternsService = getIndexPatterns();
  const indexPattern = await indexPatternsService.get(indexId);
  const aggConfigs = getSearchService().aggs.createAggConfigs(
    indexPattern,
    cloneDeep(aggConfigParams)
  );

  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );

  const opensearchaggs = buildExpressionFunction<OpenSearchaggsExpressionFunctionDefinition>(
    'opensearchaggs',
    {
      index: indexId,
      metricsAtAllLevels: style?.showMetricsAtAllLevels || false,
      partialRows: style?.showPartialRows || false,
      aggConfigs: JSON.stringify(aggConfigs.aggs),
      includeFormatHints: false,
    }
  );

  let expressionFns = [opensearchDashboards, opensearchaggs];

  if (useVega === true && searchContext) {
    const opensearchDashboardsContext = buildExpressionFunction('opensearch_dashboards_context', {
      timeRange: JSON.stringify(searchContext.timeRange || {}),
      filters: JSON.stringify(searchContext.filters || []),
      query: JSON.stringify(searchContext.query || []),
    });
    expressionFns = [opensearchDashboards, opensearchDashboardsContext, opensearchaggs];
  }

  return {
    aggConfigs,
    indexPattern,
    expressionFns,
  };
};
