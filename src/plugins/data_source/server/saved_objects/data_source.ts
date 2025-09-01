/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { flow } from 'lodash';
import { SavedObjectMigrationFn, SavedObjectsType } from 'opensearch-dashboards/server';

// create a migration function which return the doc without any changes
export const migrateDataSource: SavedObjectMigrationFn<any, any> = (doc) => ({
  ...doc,
});

export const dataSource: SavedObjectsType = {
  name: 'data-source',
  namespaceType: 'agnostic',
  hidden: false,
  management: {
    icon: 'database',
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      return obj.attributes.title;
    },
    getEditUrl(obj) {
      return `/management/opensearch-dashboards/dataSources/${encodeURIComponent(obj.id)}`;
    },
    getInAppUrl(obj) {
      return {
        path: `/app/management/opensearch-dashboards/dataSources/${encodeURIComponent(obj.id)}`,
        uiCapabilitiesPath: 'management.opensearchDashboards.dataSources',
      };
    },
  },
  mappings: {
    dynamic: false,
    properties: {
      title: {
        type: 'text',
      },
    },
  },
  migrations: {
    '2.4.0': flow(migrateDataSource), // 2.4.0 is the version that introduces the datasource
  },
};
