/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';
import { searchMigrations } from './search_migrations';

export const exploreSavedObjectType: SavedObjectsType = {
  name: 'explore',
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'discoverApp',
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      return obj.attributes.title;
    },
    getEditUrl(obj) {
      return `/management/opensearch-dashboards/objects/savedExplore/${encodeURIComponent(obj.id)}`;
    },
    getInAppUrl(obj) {
      return {
        path: `/app/explore#/view/${encodeURIComponent(obj.id)}`,
        uiCapabilitiesPath: 'discover.show',
      };
    },
  },
  mappings: {
    properties: {
      title: {
        type: 'text',
      },
      description: {
        type: 'text',
      },
      legacyState: {
        type: 'text',
        index: false,
      },
      uiState: {
        type: 'text',
        index: false,
      },
      queryState: {
        type: 'text',
        index: false,
      },
      version: { type: 'integer' },
      // Need to add a kibanaSavedObjectMeta attribute here to follow the current saved object flow
      // When we save a saved object, the saved object plugin will extract the search source into two parts
      // Some information will be put into kibanaSavedObjectMeta while others will be created as a reference object and pushed to the reference array
      kibanaSavedObjectMeta: {
        properties: { searchSourceJSON: { type: 'text', index: false } },
      },
    },
  },
  migrations: searchMigrations as any,
};
