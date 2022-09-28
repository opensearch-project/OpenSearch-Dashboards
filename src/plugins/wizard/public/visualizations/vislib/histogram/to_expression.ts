/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildVislibDimensions } from '../../../../../visualizations/public';
import { buildExpression, buildExpressionFunction } from '../../../../../expressions/public';
import { HistogramOptionsDefaults } from './histogram_vis_type';
import { getAggExpressionFunctions } from '../../common/expression_helpers';
import { VislibRootState, getValueAxes, getPipelineParams } from '../common';
import { createVis } from '../common/create_vis';

export const toExpression = async ({
  style: styleState,
  visualization,
}: VislibRootState<HistogramOptionsDefaults>) => {
  const { aggConfigs, expressionFns, indexPattern } = await getAggExpressionFunctions(
    visualization
  );
  const { addLegend, addTooltip, legendPosition, type } = styleState;

  const vis = await createVis(type, aggConfigs, indexPattern);

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

  const vislib = buildExpressionFunction<any>('vislib', {
    type,
    visConfig: JSON.stringify(visConfig),
  });

  return buildExpression([...expressionFns, vislib]).toString();
};
