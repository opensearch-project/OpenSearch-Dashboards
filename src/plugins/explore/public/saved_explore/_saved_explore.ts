/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { extractReferences, injectReferences } from './saved_explore_references';
import { GetDatasetTypeConfig, inlineDatasetReferences } from './inline_dataset_references';

export const SAVED_OBJECT_TYPE = 'explore';

/**
 * @param getDatasetTypeConfig the dataset type's config, for the types whose datasets have no saved
 *   object (inlineDatasetReferences); without it, every search source dataset is saved as a
 *   reference. The rows in `queries` reference their index patterns either way.
 */
export function createSavedExploreClass(
  services: SavedObjectOpenSearchDashboardsServices,
  getDatasetTypeConfig?: GetDatasetTypeConfig
) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedExplore extends SavedObjectClass {
    public static type: string = 'explore';
    public static mapping = {
      title: 'text',
      description: 'text',
      hits: 'integer',
      columns: 'keyword',
      sort: 'keyword',
      version: 'integer',
      type: 'text',
      visualization: 'text',
      uiState: 'text',
      queries: 'text',
    };
    // Order these fields to the top, the rest are alphabetical
    public static fieldOrder = ['title', 'description'];
    public static searchSource = true;

    public id: string;
    public showInRecentlyAccessed: boolean;

    constructor(id: string) {
      super({
        id,
        type: 'explore',
        mapping: {
          title: 'text',
          description: 'text',
          hits: 'integer',
          columns: 'keyword',
          sort: 'keyword',
          version: 'integer',
          type: 'text',
          visualization: 'text',
          uiState: 'text',
          queries: 'text',
        },
        searchSource: true,
        // Each visualization editor row's index pattern (`queries`) is a reference too.
        injectReferences,
        // The rows' index patterns become references, and a search source dataset with no saved
        // object behind it stays inline.
        extractReferences: (doc) => {
          const withRowReferences = extractReferences(doc);
          return getDatasetTypeConfig
            ? inlineDatasetReferences(getDatasetTypeConfig)(withRowReferences)
            : withRowReferences;
        },
        defaults: {
          title: '',
          description: '',
          columns: [],
          hits: 0,
          sort: [],
          version: 1,
          type: '',
          visualization: '',
          uiState: '',
          queries: '',
        },
      });
      this.showInRecentlyAccessed = true;
      this.id = id;
      this.getFullPath = () => `/app/explore#/view/${String(this.id)}`;
    }
  }

  return SavedExplore as new (id: string) => SavedObject;
}
