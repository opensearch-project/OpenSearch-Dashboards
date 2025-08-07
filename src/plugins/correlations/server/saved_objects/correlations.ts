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

import { SavedObjectsType } from '../../../../core/server';

// @experimental This API is experimental and might change in future releases.
export const correlationsSavedObjectType: SavedObjectsType = {
  name: 'correlations',
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'link',
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      return `Correlation ${obj.id} - ${obj.attributes.correlationType}`;
    },
  },
  mappings: {
    properties: {
      correlationType: {
        type: 'keyword',
      },
      version: {
        type: 'keyword',
      },
      entities: {
        type: 'object',
        enabled: false,
      },
    },
  },
  migrations: {},
};
