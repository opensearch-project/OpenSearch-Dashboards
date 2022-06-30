/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedWizardVisClass } from './_saved_vis';

export type SavedWizardLoader = ReturnType<typeof createSavedWizardLoader>;
export function createSavedWizardLoader(services: SavedObjectOpenSearchDashboardsServices) {
  const { savedObjectsClient } = services;
  const SavedWizardVisClass = createSavedWizardVisClass(services);

  return new SavedObjectLoader(SavedWizardVisClass, savedObjectsClient);
}
