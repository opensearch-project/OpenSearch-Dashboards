/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import {
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';
import { createSavedMetricClass } from './_saved_metric_viz';

export function createSavedMetricLoader(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedMetricClass = createSavedMetricClass(services);
  const savedMetricLoader = new SavedObjectLoader(SavedMetricClass, services.savedObjectsClient);
  // Customize loader properties since adding an 's' on type doesn't work for type 'search' .
  savedMetricLoader.loaderProperties = {
    name: 'metric',
    noun: 'Metric',
    nouns: 'metrics',
  };

  savedMetricLoader.urlFor = (id: string) => (id ? `#/view/${encodeURIComponent(id)}` : '#/');

  return savedMetricLoader;
}
