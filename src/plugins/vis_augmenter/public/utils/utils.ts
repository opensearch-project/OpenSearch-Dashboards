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
  VisLayerErrorTypes,
} from '../';
import { PLUGIN_AUGMENTATION_ENABLE_SETTING } from '../../common/constants';
import { getUISettings } from '../services';
import { IUiSettingsClient } from '../../../../core/public';

export const isEligibleForVisLayers = (vis: Vis, uiSettingsClient?: IUiSettingsClient): boolean => {
  // Only support a date histogram
  const dateHistograms = vis.data?.aggs?.byTypeName?.('date_histogram');
  if (!Array.isArray(dateHistograms) || dateHistograms.length !== 1) return false;

  // Ensure there is only 1 x-axis and it has to be on the bottom
  const xAxis = vis.params?.categoryAxes;
  if (!Array.isArray(xAxis) || xAxis.length !== 1 || xAxis[0]?.position !== 'bottom') return false;

  // Additionally, to have a valid x-axis, there needs to be a segment aggregation
  const segmentAggs = vis.data.aggs!.bySchemaName('segment');
  if (!Array.isArray(segmentAggs) || segmentAggs.length === 0) return false;

  // Require metrics for multiple supported y-axis only and no other aggregation types
  const metricAggs = vis.data.aggs!.bySchemaName('metric');
  if (
    !Array.isArray(metricAggs) ||
    metricAggs.length === 0 ||
    metricAggs.length !== vis.data.aggs!.aggs?.length - 1
  )
    return false;

  // Must have only line series
  if (
    !Array.isArray(vis.params.seriesParams) ||
    vis.params.type !== 'line' ||
    vis.params.seriesParams.some((seriesParam: { type: string }) => seriesParam.type !== 'line')
  )
    return false;

  // Checks if the augmentation setting is enabled
  const config = uiSettingsClient ?? getUISettings();
  return config.get(PLUGIN_AUGMENTATION_ENABLE_SETTING);
};

/**
 * Using a SavedAugmentVisLoader, fetch all saved objects that are of 'augment-vis' type.
 * Filter by vis ID by passing in a 'hasReferences' obj with the vis ID to the findAll() fn call,
 * and optionally by plugin resource ID list, if specified.
 */
export const getAugmentVisSavedObjs = async (
  visId: string | undefined,
  loader: SavedAugmentVisLoader | undefined,
  uiSettings?: IUiSettingsClient | undefined,
  pluginResourceIds?: string[] | undefined
): Promise<ISavedAugmentVis[] | Error> => {
  // Using optional services provided, or the built-in services from this plugin
  const config = uiSettings !== undefined ? uiSettings : getUISettings();
  const isAugmentationEnabled = config.get(PLUGIN_AUGMENTATION_ENABLE_SETTING);
  if (!isAugmentationEnabled) {
    throw new Error(
      'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
    );
  }
  try {
    // If there are any plugin resource IDs specified, add a search string and search field
    // into findAll() call
    const pluginResourceIdsSpecified =
      Array.isArray(pluginResourceIds) && pluginResourceIds.length > 0;
    const resp = await loader?.findAll(
      pluginResourceIdsSpecified ? pluginResourceIds!.join('|') : '',
      100,
      undefined,
      {
        type: 'visualization',
        id: visId as string,
      },
      pluginResourceIdsSpecified ? ['pluginResource.id'] : undefined
    );
    return (get(resp, 'hits', []) as any[]) as ISavedAugmentVis[];
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

/**
 * Cleans up any stale saved objects caused by plugin resources being deleted. Kicks
 * off an async call to delete the stale objs.
 *
 * @param augmentVisSavedObs the original augment-vis saved objs for this particular vis
 * @param visLayers the produced VisLayers containing details if the resource has been deleted
 * @param visualizationsLoader the visualizations saved object loader to handle deletion
 */

export const cleanupStaleObjects = (
  augmentVisSavedObjs: ISavedAugmentVis[],
  visLayers: VisLayer[],
  loader: SavedAugmentVisLoader | undefined
): void => {
  const staleVisLayers = visLayers
    .filter((visLayer) => isVisLayerWithError(visLayer))
    .filter(
      (visLayerWithError) => visLayerWithError.error?.type === VisLayerErrorTypes.RESOURCE_DELETED
    );
  if (!isEmpty(staleVisLayers)) {
    const objIdsToDelete = [] as string[];
    staleVisLayers.forEach((staleVisLayer) => {
      // Match the VisLayer to its origin saved obj to extract the to-be-deleted saved obj ID
      const deletedPluginResourceId = staleVisLayer.pluginResource.id;
      const savedObjId = augmentVisSavedObjs.find(
        (savedObj) => savedObj.pluginResource.id === deletedPluginResourceId
      )?.id;
      if (savedObjId !== undefined) objIdsToDelete.push(savedObjId);
    });
    loader?.delete(objIdsToDelete);
  }
};
