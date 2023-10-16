/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedVisBuilderVisClass } from './_saved_vis';

export type SavedVisBuilderLoader = ReturnType<typeof createSavedVisBuilderLoader>;
export function createSavedVisBuilderLoader(services: SavedObjectOpenSearchDashboardsServices) {
  const { savedObjectsClient } = services;
  const SavedVisBuilderVisClass = createSavedVisBuilderVisClass(services);

  return new SavedObjectLoader(SavedVisBuilderVisClass, savedObjectsClient);
}
