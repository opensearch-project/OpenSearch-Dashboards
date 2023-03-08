/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { Vis } from '../../../../plugins/visualizations/public';
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

/**
 * Using a SavedAugmentVisLoader, fetch all saved objects that are of 'augment-vis' type
 * and filter out to return the ones associated to the particular vis via
 * matching vis ID.
 */
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

/**
 * Given an array of augment-vis saved objects that contain expression function details,
 * construct a pipeline that will execute each of these expression functions.
 * Note that the order does not matter; each expression function should be taking
 * in the current output and appending its results to it, such that the end result
 * contains the results from each expression function that was ran.
 */
export const buildPipelineFromAugmentVisSavedObjs = (objs: ISavedAugmentVis[]): string => {
  try {
    const visLayerExpressionFns = objs.map((obj: ISavedAugmentVis) =>
      buildExpressionFunction<VisLayerFunctionDefinition>(
        obj.visLayerExpressionFn.name,
        obj.visLayerExpressionFn.args
      )
    ) as Array<ExpressionAstFunctionBuilder<VisLayerFunctionDefinition>>;
    const ast = buildExpression(visLayerExpressionFns).toAst();
    return formatExpression(ast);
  } catch (e) {
    throw new Error('Expression function from augment-vis saved objects could not be generated');
  }
};
