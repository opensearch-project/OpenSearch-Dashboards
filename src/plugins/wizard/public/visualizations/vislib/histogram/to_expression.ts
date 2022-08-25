/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { Vis, buildVislibDimensions } from '../../../../../visualizations/public';
import { OpenSearchaggsExpressionFunctionDefinition } from '../../../../../data/common';
import { buildExpression, buildExpressionFunction } from '../../../../../expressions/public';
import { RootState } from '../../../application/utils/state_management';
import { HistogramOptionsDefaults } from './histogram_vis_type';
import { getAggService, getIndexPatterns } from '../../../plugin_services';

interface HistogramRootState extends RootState {
  style: HistogramOptionsDefaults;
}

export const toExpression = async ({ style: styleState, visualization }: HistogramRootState) => {
  const { activeVisualization, indexPattern: indexId = '' } = visualization;
  const { aggConfigParams } = activeVisualization || {};

  const indexPatternsService = getIndexPatterns();
  const indexPattern = await indexPatternsService.get(indexId);
  const aggConfigs = getAggService().createAggConfigs(indexPattern, cloneDeep(aggConfigParams));

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

  // ----------  START  -----------

  const pipelineConfigs = {
    // todo: this will blow up for time x dimensions
    timefilter: null, // todo: get the time filter from elsewhere
  };

  const histogramVisObj = new Vis('histogram');
  histogramVisObj.data.aggs = aggConfigs;

  const dimensions = await buildVislibDimensions(histogramVisObj, pipelineConfigs as any);

  // what do we put in this "vis config"?
  const visConfig = {
    addLegend: true,
    addTimeMarker: false,
    addTooltip: true,
    dimensions,
  };

  const histogramVis = buildExpressionFunction<any>('vislib', {
    type: 'histogram',
    visConfig: JSON.stringify(visConfig),
  });

  // What does vislib need?

  // ------------------  END  ----------

  const ast = buildExpression([opensearchaggs, histogramVis]);

  return ast.toString();
};
