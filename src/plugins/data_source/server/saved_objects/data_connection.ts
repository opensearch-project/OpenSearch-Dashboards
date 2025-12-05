/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';

export const dataConnection: SavedObjectsType = {
  name: 'data-connection',
  namespaceType: 'agnostic',
  hidden: false,
  management: {
    icon: 'apps',
    defaultSearchField: 'connectionId',
    importableAndExportable: true,
    getTitle(obj) {
      return obj.attributes.connectionId;
    },
  },
  mappings: {
    dynamic: false,
    properties: {
      connectionId: {
        type: 'text',
      },
      type: {
        type: 'text',
      },
      meta: {
        type: 'text',
      },
    },
  },
  migrations: {},
};
