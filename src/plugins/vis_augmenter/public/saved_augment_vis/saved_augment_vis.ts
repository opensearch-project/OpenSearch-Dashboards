/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, isEmpty } from 'lodash';
import { IUiSettingsClient, SavedObjectsFindOptions } from 'opensearch-dashboards/public';
import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedAugmentVisClass } from './_saved_augment_vis';
import { VisLayerTypes } from '../types';
import { getUISettings } from '../services';
import { AugmentVisSavedObjectAttributes, PLUGIN_AUGMENTATION_ENABLE_SETTING } from '../../common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SavedObjectOpenSearchDashboardsServicesWithAugmentVis
  extends SavedObjectOpenSearchDashboardsServices {}
export type SavedAugmentVisLoader = ReturnType<typeof createSavedAugmentVisLoader>;

export class SavedObjectLoaderAugmentVis extends SavedObjectLoader {
  private readonly config: IUiSettingsClient = getUISettings();

  mapHitSource = (source: AugmentVisSavedObjectAttributes, id: string) => {
    source.id = id;
    source.visId = get(source, 'visReference.id', '') as string;

    if (isEmpty(source.visReference)) {
      source.error = 'visReference is missing in augment-vis saved object';
      return source;
    }
    if (isEmpty(source.visLayerExpressionFn)) {
      source.error = 'visLayerExpressionFn is missing in augment-vis saved object';
      return source;
    }
    if (!((get(source, 'visLayerExpressionFn.type', '') as string) in VisLayerTypes)) {
      source.error = 'Unknown VisLayer expression function type';
      return source;
    }
    if (get(source, 'originPlugin', undefined) === undefined) {
      source.error = 'originPlugin is missing in augment-vis saved object';
      return source;
    }
    if (get(source, 'pluginResource.type', undefined) === undefined) {
      source.error = 'pluginResource.type is missing in augment-vis saved object';
      return source;
    }
    if (get(source, 'pluginResource.id', undefined) === undefined) {
      source.error = 'pluginResource.id is missing in augment-vis saved object';
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
    attributes: AugmentVisSavedObjectAttributes;
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
    this.isAugmentationEnabled();
    return super.get(opts);
  }

  /**
   * TODO: Rather than use a hardcoded limit, implement pagination. See
   * https://github.com/elastic/kibana/issues/8044 for reference.
   *
   * @param search
   * @param size
   * @param fields
   * @param hasReference Optional field to specify a reference
   * @param searchFields Optional field to specify the search fields in the query
   * @returns {Promise}
   */
  findAll(
    search: string = '',
    size: number = 100,
    fields?: string[],
    hasReference?: SavedObjectsFindOptions['hasReference'],
    searchFields?: string[]
  ) {
    this.isAugmentationEnabled();
    return super.findAll(search, size, fields, hasReference, searchFields);
  }

  find(search: string = '', size: number = 100) {
    this.isAugmentationEnabled();
    return super.find(search, size);
  }

  private isAugmentationEnabled() {
    const isAugmentationEnabled = this.config.get(PLUGIN_AUGMENTATION_ENABLE_SETTING, true);
    if (!isAugmentationEnabled) {
      throw new Error(
        'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
      );
    }
  }
}

export function createSavedAugmentVisLoader(
  services: SavedObjectOpenSearchDashboardsServicesWithAugmentVis
) {
  const { savedObjectsClient } = services;

  const SavedAugmentVis = createSavedAugmentVisClass(services);
  return new SavedObjectLoaderAugmentVis(SavedAugmentVis, savedObjectsClient);
}
