/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';

export const dataSource: SavedObjectsType = {
  name: 'data-source',
  namespaceType: 'agnostic',
  hidden: false,
  management: {
    icon: 'apps', // todo: pending ux #2034
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle(obj) {
      return obj.attributes.title;
    },
    // todo: update getEditUrl & getInAppUrl after #2021
  },
  mappings: {
    dynamic: false,
    properties: {
      title: {
        type: 'text',
      },
    },
  },
};
