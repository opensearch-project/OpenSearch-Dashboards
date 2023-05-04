/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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

export const getStats = (
  augmentVisSavedObjects: SavedObjectsFindResponse<AugmentVisSavedObjectAttributes>
): VisAugmenterStats => {
  // TODO: instantiate count/agg maps here
  augmentVisSavedObjects.saved_objects.forEach((augmentVisObj) => {
    // TODO: extract/populate maps here
  });

  return {
    total_objs: augmentVisSavedObjects.total,
    obj_breakdown: {
      origin_plugin: {
        test: 1,
      },
      plugin_resource_type: {
        test: 1,
      },
      plugin_resource_id: {
        test: 1,
      },
      visualization_id: {
        test: 1,
      },
    },
  };
};
