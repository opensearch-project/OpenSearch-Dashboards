/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedAgentTracesClass } from './_saved_agent_traces';

export function createSavedAgentTracesLoader(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedAgentTracesClass = createSavedAgentTracesClass(services);
  const savedAgentTracesLoader = new SavedObjectLoader(
    SavedAgentTracesClass,
    services.savedObjectsClient
  );

  savedAgentTracesLoader.urlFor = (id: string) => (id ? `#/view/${encodeURIComponent(id)}` : '#/');

  return savedAgentTracesLoader;
}
