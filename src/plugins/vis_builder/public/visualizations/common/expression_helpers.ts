/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { OpenSearchaggsExpressionFunctionDefinition } from '../../../../data/public';
import { ExpressionFunctionOpenSearchDashboards } from '../../../../expressions';
import { buildExpressionFunction } from '../../../../expressions/public';
import { VisualizationState } from '../../application/utils/state_management';
import { getSearchService, getIndexPatterns } from '../../plugin_services';
import { StyleState } from '../../application/utils/state_management';

export const getAggExpressionFunctions = async (
  visualization: VisualizationState,
  style?: StyleState
) => {
  const { activeVisualization, indexPattern: indexId = '' } = visualization;
  const { aggConfigParams } = activeVisualization || {};

  const indexPatternsService = getIndexPatterns();
  const indexPattern = await indexPatternsService.get(indexId);
  // aggConfigParams is the serealizeable aggConfigs that need to be reconstructed here using the agg servce
  const aggConfigs = getSearchService().aggs.createAggConfigs(
    indexPattern,
    cloneDeep(aggConfigParams)
  );

  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );

  // soon this becomes: const opensearchaggs = vis.data.aggs!.toExpressionAst();
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

  return {
    aggConfigs,
    indexPattern,
    expressionFns: [opensearchDashboards, opensearchaggs],
  };
};
