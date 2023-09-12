/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import {
  SavedObjectsFindResponse,
  SavedObjectsClientContract,
} from '../../../../../src/core/server';
import { AugmentVisSavedObjectAttributes } from '../../common';

interface ObjectBreakdown {
  origin_plugin: { [key: string]: number };
  plugin_resource_type: { [key: string]: number };
  plugin_resource_id: { [key: string]: number };
  visualization_id: { [key: string]: number };
}

interface VisAugmenterStats {
  total_objs: number;
  obj_breakdown: ObjectBreakdown;
}

export const getAugmentVisSavedObjects = async (
  savedObjectsClient: SavedObjectsClientContract,
  perPage: number
): Promise<SavedObjectsFindResponse<AugmentVisSavedObjectAttributes>> => {
  const augmentVisSavedObjects: SavedObjectsFindResponse<AugmentVisSavedObjectAttributes> = await savedObjectsClient?.find(
    {
      type: 'augment-vis',
      perPage,
    }
  );
  // If there are more than perPage of objs, we need to make additional requests
  if (augmentVisSavedObjects.total > perPage) {
    const iterations = Math.ceil(augmentVisSavedObjects.total / perPage);
    for (let i = 1; i < iterations; i++) {
      const augmentVisSavedObjectsPage: SavedObjectsFindResponse<AugmentVisSavedObjectAttributes> = await savedObjectsClient?.find(
        {
          type: 'augment-vis',
          perPage,
          page: i + 1,
        }
      );
      augmentVisSavedObjects.saved_objects = [
        ...augmentVisSavedObjects.saved_objects,
        ...augmentVisSavedObjectsPage.saved_objects,
      ];
    }
  }
  return augmentVisSavedObjects;
};

/**
 * Given the _find response that contains all of the saved objects, iterate through them and
 * increment counters for each unique value we are tracking
 */
export const getStats = (
  resp: SavedObjectsFindResponse<AugmentVisSavedObjectAttributes>
): VisAugmenterStats => {
  const originPluginMap = {} as { [originPlugin: string]: number };
  const pluginResourceTypeMap = {} as { [pluginResourceType: string]: number };
  const pluginResourceIdMap = {} as { [pluginResourceId: string]: number };
  const visualizationIdMap = {} as { [visualizationId: string]: number };

  resp.saved_objects.forEach((augmentVisObj) => {
    const originPlugin = augmentVisObj.attributes.originPlugin;
    const pluginResourceType = augmentVisObj.attributes.pluginResource.type;
    const pluginResourceId = augmentVisObj.attributes.pluginResource.id;
    const visualizationId = augmentVisObj.references[0].id as string;

    originPluginMap[originPlugin] = (get(originPluginMap, originPlugin, 0) as number) + 1;
    pluginResourceTypeMap[pluginResourceType] =
      (get(pluginResourceTypeMap, pluginResourceType, 0) as number) + 1;
    pluginResourceIdMap[pluginResourceId] =
      (get(pluginResourceIdMap, pluginResourceId, 0) as number) + 1;
    visualizationIdMap[visualizationId] =
      (get(visualizationIdMap, visualizationId, 0) as number) + 1;
  });

  return {
    total_objs: resp.total,
    obj_breakdown: {
      origin_plugin: originPluginMap,
      plugin_resource_type: pluginResourceTypeMap,
      plugin_resource_id: pluginResourceIdMap,
      visualization_id: visualizationIdMap,
    },
  };
};
