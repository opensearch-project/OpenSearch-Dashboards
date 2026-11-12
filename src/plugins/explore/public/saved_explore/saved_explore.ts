/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedExploreClass } from './_saved_explore';
import { GetDatasetTypeConfig } from './inline_dataset_references';

export function createSavedExploreLoader(
  services: SavedObjectOpenSearchDashboardsServices,
  getDatasetTypeConfig?: GetDatasetTypeConfig
) {
  const SavedExploreClass = createSavedExploreClass(services, getDatasetTypeConfig);
  const savedExploreLoader = new SavedObjectLoader(SavedExploreClass, services.savedObjectsClient);

  savedExploreLoader.urlFor = (id: string) => (id ? `#/view/${encodeURIComponent(id)}` : '#/');

  return savedExploreLoader;
}
