/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';

export const credential: SavedObjectsType = {
  name: 'credential',
  hidden: false,
  namespaceType: 'agnostic',
  management: {
    defaultSearchField: 'title',
    // TODO: Support import / export https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1872
    importableAndExportable: false,
    getTitle(obj) {
      return obj.attributes.title;
    },
    getEditUrl(obj) {
      return `/management/opensearch-dashboards/credentials/${encodeURIComponent(obj.id)}`;
    },
    getInAppUrl(obj) {
      return {
        path: `/management/opensearch-dashboards/credentials/${encodeURIComponent(obj.id)}`,
        uiCapabilitiesPath: 'credential.show',
      };
    },
  },
  mappings: {
    dynamic: false,
    properties: {
      title: { type: 'text' },
    },
  },
  migrations: {},
};
