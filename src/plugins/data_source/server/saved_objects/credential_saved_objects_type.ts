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
    importableAndExportable: true,
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
      title: { type: 'text', index: false },
      credentialType: { type: 'keyword', index: false },
      credentialMaterials: { type: 'object' },
      description: { type: 'text', index: false },
    },
  },
  migrations: {},
};
