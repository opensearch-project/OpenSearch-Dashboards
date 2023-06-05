/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';

export const augmentVisSavedObjectType: SavedObjectsType = {
  name: 'augment-vis',
  hidden: false,
  namespaceType: 'single',
  management: {
    importableAndExportable: true,
    getTitle(obj) {
      return `augment-vis-${obj?.attributes?.originPlugin}`;
    },
    getEditUrl(obj) {
      return `/management/opensearch-dashboards/objects/savedAugmentVis/${encodeURIComponent(
        obj.id
      )}`;
    },
  },
  mappings: {
    properties: {
      title: { type: 'text' },
      description: { type: 'text' },
      originPlugin: { type: 'text' },
      pluginResource: {
        properties: {
          type: { type: 'text' },
          id: { type: 'text' },
        },
      },
      visName: { type: 'keyword', index: false, doc_values: false },
      visLayerExpressionFn: {
        properties: {
          type: { type: 'text' },
          name: { type: 'text' },
          // keeping generic to not limit what users may pass as args to their fns
          // users may not have this field at all, if no args are needed
          args: { type: 'object', dynamic: true },
        },
      },
      version: { type: 'integer' },
    },
  },
};
