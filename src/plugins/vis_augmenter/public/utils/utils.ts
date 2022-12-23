/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { Vis } from '../../../visualizations/public';
import {
  formatExpression,
  buildExpressionFunction,
  buildExpression,
  ExpressionAstFunctionBuilder,
} from '../../../../plugins/expressions/public';
import { ISavedAugmentVis, SavedAugmentVisLoader, VisLayerFunctionDefinition } from '../';

// TODO: provide a deeper eligibility check.
// Tracked in https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3268
export const isEligibleForVisLayers = (vis: Vis): boolean => {
  return vis.params.type === 'line';
};

export const getAugmentVisSavedObjs = async (
  visId: string | undefined,
  loader: SavedAugmentVisLoader | undefined
): Promise<ISavedAugmentVis[]> => {
  try {
    const resp = await loader?.findAll();
    const allSavedObjects = (get(resp, 'hits', []) as any[]) as ISavedAugmentVis[];
    return allSavedObjects.filter((hit: ISavedAugmentVis) => hit.visId === visId);
  } catch (e) {
    return [] as ISavedAugmentVis[];
  }
};

export const buildPipelineFromAugmentVisSavedObjs = (objs: ISavedAugmentVis[]): string => {
  const visLayerExpressionFns = [] as Array<
    ExpressionAstFunctionBuilder<VisLayerFunctionDefinition>
  >;

  try {
    objs.forEach((obj: ISavedAugmentVis) => {
      visLayerExpressionFns.push(
        buildExpressionFunction<VisLayerFunctionDefinition>(
          obj.visLayerExpressionFn.name,
          obj.visLayerExpressionFn.args
        )
      );
    });
    const ast = buildExpression(visLayerExpressionFns).toAst();
    return formatExpression(ast);
  } catch (e) {
    throw new Error('Expression function from augment-vis saved objects could not be generated');
  }
};
