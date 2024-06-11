/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedHomepageClass } from './_saved_homepage';

export type SavedHomepagesLoader = ReturnType<typeof createSavedHomepageLoader>;
export function createSavedHomepageLoader(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedHomepage = createSavedHomepageClass(services);
  return new SavedObjectLoader(SavedHomepage, services.savedObjectsClient);
}
