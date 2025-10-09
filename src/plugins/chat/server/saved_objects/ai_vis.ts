/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from '../../../../core/server';

export const aiVisType: SavedObjectsType = {
  name: 'ai_vis',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      title: { type: 'text' },
      description: { type: 'text' },
      visualizationType: { type: 'keyword' },
      visualizationData: { type: 'text' },
      chartType: { type: 'keyword' },
      params: { type: 'text' },
      version: { type: 'integer' },
    },
  },
  management: {
    importableAndExportable: true,
    getTitle(obj) {
      return obj.attributes.title;
    },
    getInAppUrl(obj) {
      return {
        path: `/app/chat#/visualization/${encodeURIComponent(obj.id)}`,
        uiCapabilitiesPath: 'chat.show',
      };
    },
  },
};
