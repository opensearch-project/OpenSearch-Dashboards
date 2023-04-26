/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, isEmpty } from 'lodash';
import { Vis } from '../../../../plugins/visualizations/public';
import {
  formatExpression,
  buildExpressionFunction,
  buildExpression,
  ExpressionAstFunctionBuilder,
} from '../../../../plugins/expressions/public';
import {
  ISavedAugmentVis,
  SavedAugmentVisLoader,
  VisLayerFunctionDefinition,
  VisLayer,
  isVisLayerWithError,
} from '../';

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

/**
 * Returns an error with an aggregated message about all of the
 * errors found in the set of VisLayers. If no errors, returns undefined.
 */
export const getAnyErrors = (visLayers: VisLayer[], visTitle: string): Error | undefined => {
  const visLayersWithErrors = visLayers.filter((visLayer) => isVisLayerWithError(visLayer));
  if (!isEmpty(visLayersWithErrors)) {
    // Aggregate by unique plugin resource type
    const resourceTypes = [
      ...new Set(visLayersWithErrors.map((visLayer) => visLayer.pluginResource.type)),
    ];

    let msgDetails = '';
    resourceTypes.forEach((type, index) => {
      const matchingVisLayers = visLayersWithErrors.filter(
        (visLayer) => visLayer.pluginResource.type === type
      );
      if (index !== 0) msgDetails += '\n\n\n';
      msgDetails += `-----${type}-----`;
      matchingVisLayers.forEach((visLayer, idx) => {
        if (idx !== 0) msgDetails += '\n';
        msgDetails += `\nID: ${visLayer.pluginResource.id}`;
        msgDetails += `\nMessage: "${visLayer.error?.message}"`;
      });
    });

    const err = new Error(`Certain plugin resources failed to load on the ${visTitle} chart`);
    // We set as the stack here so it can be parsed and shown cleanly in the details modal coming from the error toast notification.
    err.stack = msgDetails;
    return err;
  } else {
    return undefined;
  }
};
