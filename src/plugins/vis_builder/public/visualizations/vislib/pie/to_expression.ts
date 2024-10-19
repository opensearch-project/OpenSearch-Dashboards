/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildVislibDimensions, getVisSchemas } from '../../../../../visualizations/public';
import {
  buildExpression,
  buildExpressionFunction,
  IExpressionLoaderParams,
} from '../../../../../expressions/public';
import { PieOptionsDefaults } from './pie_vis_type';
import { getAggExpressionFunctions } from '../../common/expression_helpers';
import { VislibRootState, getPipelineParams } from '../common';
import { createVis } from '../common/create_vis';
import { buildPipeline } from '../../../../../visualizations/public';
import { createVegaSpec } from '../../vega/vega_spec_factory';
import { executeExpression } from '../../vega/utils/expression_helper';

export const toExpression = async (
  { style: styleState, visualization }: VislibRootState<PieOptionsDefaults>,
  searchContext: IExpressionLoaderParams['searchContext']
) => {
  const { expressionFns, aggConfigs, indexPattern } = await getAggExpressionFunctions(
    visualization,
    styleState,
    true,
    searchContext
  );
  const {
    addLegend,
    addTooltip,
    showMetricsAtAllLevels,
    isDonut,
    legendPosition,
    type,
  } = styleState;
  const vis = await createVis(type, aggConfigs, indexPattern, searchContext);
  const params = getPipelineParams();
  const schemas = getVisSchemas(vis, {
    timeRange: params.timeRange,
    timefilter: params.timefilter,
  });

  const dimensions = {
    metric: schemas.metric[0],
    buckets: schemas.group,
    splitRow: schemas.split_row,
    splitColumn: schemas.split_column,
  };

  const visConfig = {
    addLegend,
    addTooltip,
    isDonut,
    legendPosition,
    dimensions,
    showMetricsAtAllLevels,
  };

  const rawDataFn = buildExpressionFunction('rawData', {});
  const dataExpression = buildExpression([...expressionFns, rawDataFn]).toString();
  // Execute the expression to get the raw data
  const rawData = await executeExpression(dataExpression, searchContext);

  const vegaSpec = createVegaSpec(rawData, visConfig, styleState);

  const visVega = await createVis('vega', aggConfigs, indexPattern, searchContext);
  visVega.params = {
    spec: JSON.stringify(vegaSpec),
  };

  const vegaExpression = await buildPipeline(visVega, {
    timefilter: params.timefilter,
    timeRange: params.timeRange,
    abortSignal: undefined,
    visLayers: undefined,
    visAugmenterConfig: undefined,
  });

  return vegaExpression;
};
