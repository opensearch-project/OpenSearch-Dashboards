/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vis, buildVislibDimensions } from '../../../../../visualizations/public';
import { buildExpression, buildExpressionFunction } from '../../../../../expressions/public';
import { AreaOptionsDefaults } from './area_vis_type';
import { getAggExpressionFunctions } from '../../common/expression_helpers';
import { VislibRootState, getValueAxes, getPipelineParams } from '../common';

export const toExpression = async ({
  style: styleState,
  visualization,
}: VislibRootState<AreaOptionsDefaults>) => {
  const { aggConfigs, expressionFns } = await getAggExpressionFunctions(visualization);
  const { addLegend, addTooltip, legendPosition, type } = styleState;
  const params = getPipelineParams();

  const vis = new Vis(type);
  vis.data.aggs = aggConfigs;

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

  const vislib = buildExpressionFunction<any>('vislib', {
    type,
    visConfig: JSON.stringify(visConfig),
  });

  return buildExpression([...expressionFns, vislib]).toString();
};
