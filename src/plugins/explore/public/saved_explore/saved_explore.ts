/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedExploreClass } from './_saved_explore';

export function createSavedExploreLoader(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedExploreClass = createSavedExploreClass(services);
  const savedExploreLoader = new SavedObjectLoader(SavedExploreClass, services.savedObjectsClient);

  savedExploreLoader.urlFor = (id: string) => (id ? `#/view/${encodeURIComponent(id)}` : '#/');

  return savedExploreLoader;
}
