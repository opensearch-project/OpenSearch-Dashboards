/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, SavedObjectAttributes } from '../../../../core/types';

// @experimental This schema is experimental and might change in future releases.
export interface CorrelationSavedObjectAttributes extends SavedObjectAttributes {
  correlationType: string;

  version: string;

  /*
   * Using any[] for entities to allow flexible correlation structures.
   * This enables different correlation types and use cases to define their own entity schemas without strict typing constraints.
   * Each entity can contain different fields like correlatedFields, meta, datasource info.
   * @experimental - The any[] type is experimental and may be replaced with more specific types in future releases.
   */
  entities: any[];
}

export interface CorrelationSavedObject extends SavedObject<CorrelationSavedObjectAttributes> {
  type: 'correlations';
}
