/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, isEmpty } from 'lodash';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedAugmentVisClass } from './_saved_augment_vis';
import { VisLayerTypes } from '../types';
import { getUISettings } from '../services';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SavedObjectOpenSearchDashboardsServicesWithAugmentVis
  extends SavedObjectOpenSearchDashboardsServices {}
export type SavedAugmentVisLoader = ReturnType<typeof createSavedAugmentVisLoader>;

export class SavedObjectLoaderAugmentVis extends SavedObjectLoader {
  private readonly config: IUiSettingsClient = getUISettings();

  mapHitSource = (source: Record<string, any>, id: string) => {
    source.id = id;
    source.visId = get(source, 'visReference.id', '');

    if (isEmpty(source.visReference)) {
      source.error = 'visReference is missing in augment-vis saved object';
      return source;
    }
    if (isEmpty(source.visLayerExpressionFn)) {
      source.error = 'visLayerExpressionFn is missing in augment-vis saved object';
      return source;
    }
    if (!(get(source, 'visLayerExpressionFn.type', '') in VisLayerTypes)) {
      source.error = 'Unknown VisLayer expression function type';
      return source;
    }
    return source;
  };

  /**
   * Updates hit.attributes to contain an id related to the referenced visualization
   * (visId) and returns the updated attributes object.
   * @param hit
   * @returns {hit.attributes} The modified hit.attributes object, with an id and url field.
   */
  mapSavedObjectApiHits(hit: {
    references: any[];
    attributes: Record<string, unknown>;
    id: string;
  }) {
    // For now we are assuming only one vis reference per saved object.
    // If we change to multiple, we will need to dynamically handle that
    const visReference = hit.references[0];
    return this.mapHitSource({ ...hit.attributes, visReference }, hit.id);
  }

  /**
   * Retrieve a saved object by id or create new one.
   * Returns a promise that completes when the object finishes
   * initializing. Throws exception when the setting is set to false.
   * @param opts
   * @returns {Promise<SavedObject>}
   */
  get(opts?: Record<string, unknown> | string) {
    const isAugmentationEnabled = this.config.get('visualization:enablePluginAugmentation');

    if (!isAugmentationEnabled) {
      // eslint-disable-next-line no-throw-literal
      throw 'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.';
    }

    // can accept object as argument in accordance to SavedVis class
    // see src/plugins/saved_objects/public/saved_object/saved_object_loader.ts
    // @ts-ignore
    const obj = new this.Class(opts);
    return obj.init();
  }
}

export function createSavedAugmentVisLoader(
  services: SavedObjectOpenSearchDashboardsServicesWithAugmentVis
) {
  const { savedObjectsClient } = services;

  const SavedAugmentVis = createSavedAugmentVisClass(services);
  return new SavedObjectLoaderAugmentVis(SavedAugmentVis, savedObjectsClient);
}
