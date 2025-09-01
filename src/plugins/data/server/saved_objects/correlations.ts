/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from '../../../../core/server';

// @experimental This schema is experimental and might change in future releases.
export const correlationsSavedObjectType: SavedObjectsType = {
  name: 'correlations',
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'link',
    defaultSearchField: 'correlationType',
    importableAndExportable: true,
    getTitle(obj) {
      return `Correlation ${obj.id}`;
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
