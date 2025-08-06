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

import { SavedObjectAttributes, SavedObjectReference } from 'opensearch-dashboards/server';

export interface CorrelationSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  correlationType: string;
  entities: any[];
}

export interface CorrelationSavedObject {
  id: string;
  type: 'correlations';
  migrationVersion: string;
  updatedAt: string;
  attributes: CorrelationSavedObjectAttributes;
  references: SavedObjectReference[];
}
