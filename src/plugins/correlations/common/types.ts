/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, SavedObjectAttributes } from '../../../core/public';

// @experimental This API is experimental and might change in future releases.
export interface CorrelationSavedObjectAttributes extends SavedObjectAttributes {
  correlationType: string;

  version: string;
  entities: any[];
}

export interface CorrelationSavedObject extends SavedObject<CorrelationSavedObjectAttributes> {
  type: 'correlations';
}
