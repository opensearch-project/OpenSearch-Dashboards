/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { OpenSearchaggsExpressionFunctionDefinition } from '../../../../data/public';
import { ExpressionFunctionOpenSearchDashboards } from '../../../../expressions';
import { buildExpressionFunction } from '../../../../expressions/public';
import { VisualizationState } from '../../application/utils/state_management';
import { getAggService, getIndexPatterns } from '../../plugin_services';

export const getAggExpressionFunctions = async (visualization: VisualizationState) => {
  const { activeVisualization, indexPattern: indexId = '' } = visualization;
  const { aggConfigParams } = activeVisualization || {};

  const indexPatternsService = getIndexPatterns();
  const indexPattern = await indexPatternsService.get(indexId);
  const aggConfigs = getAggService().createAggConfigs(indexPattern, cloneDeep(aggConfigParams));

  const opensearchDashboards = buildExpressionFunction<ExpressionFunctionOpenSearchDashboards>(
    'opensearchDashboards',
    {}
  );

  // soon this becomes: const opensearchaggs = vis.data.aggs!.toExpressionAst();
  const opensearchaggs = buildExpressionFunction<OpenSearchaggsExpressionFunctionDefinition>(
    'opensearchaggs',
    {
      index: indexId,
      metricsAtAllLevels: false,
      partialRows: false,
      aggConfigs: JSON.stringify(aggConfigs.aggs),
      includeFormatHints: false,
    }
  );

  return {
    aggConfigs,
    expressionFns: [opensearchDashboards, opensearchaggs],
  };
};
