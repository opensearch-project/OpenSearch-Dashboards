/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';

export const augmentVisSavedObjectType: SavedObjectsType = {
  name: 'augment-vis',
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      description: { type: 'text' },
      pluginResourceId: { type: 'text' },
      visName: { type: 'keyword', index: false, doc_values: false },
      visLayerExpressionFn: {
        properties: {
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
