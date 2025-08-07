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

import { SavedObject, SavedObjectAttributes } from '../../../core/public';


export interface CorrelationSavedObjectAttributes extends SavedObjectAttributes {
  correlationType: string;

  version: string;
  entities: any[];
}

export interface CorrelationSavedObject extends SavedObject<CorrelationSavedObjectAttributes> {
  type: 'correlations';
}
