/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildVislibDimensions } from '../../../../../visualizations/public';
import {
  buildExpression,
  buildExpressionFunction,
  IExpressionLoaderParams,
} from '../../../../../expressions/public';
import { AreaOptionsDefaults } from './area_vis_type';
import { getAggExpressionFunctions } from '../../common/expression_helpers';
import { VislibRootState, getValueAxes, getPipelineParams } from '../common';
import { createVis } from '../common/create_vis';
import { buildPipeline } from '../../../../../visualizations/public';
import { createVegaSpec } from '../../vega/vega_spec_factory';
import { executeExpression } from '../../vega/utils/expression_helper';

export const toExpression = async (
  { style: styleState, visualization }: VislibRootState<AreaOptionsDefaults>,
  searchContext: IExpressionLoaderParams['searchContext'],
  useVega: boolean
) => {
  const { expressionFns, aggConfigs, indexPattern } = await getAggExpressionFunctions(
    visualization,
    styleState,
    useVega,
    searchContext
  );
  const { addLegend, addTooltip, legendPosition, type } = styleState;

  const vis = await createVis(type, aggConfigs, indexPattern, searchContext);

  const params = getPipelineParams();
  const dimensions = await buildVislibDimensions(vis, params);
  const valueAxes = getValueAxes(dimensions.y);

  // TODO: what do we want to put in this "vis config"?
  const visConfig = {
    addLegend,
    legendPosition,
    addTimeMarker: false,
    addTooltip,
    dimensions,
    valueAxes,
  };

  if (useVega === true) {
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
  } else {
    const vislib = buildExpressionFunction<any>('vislib', {
      type,
      visConfig: JSON.stringify(visConfig),
    });

    return buildExpression([...expressionFns, vislib]).toString();
  }
};
