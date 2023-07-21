/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from 'opensearch-dashboards/server';
import { WORKSPACE_TYPE } from '../constants';

export const workspace: SavedObjectsType = {
  name: WORKSPACE_TYPE,
  namespaceType: 'agnostic',
  hidden: false,
  /**
   * workspace won't appear in management page.
   */
  mappings: {
    dynamic: false,
    properties: {
      name: {
        type: 'keyword',
      },
      description: {
        type: 'text',
      },
      /**
       * In opensearch, string[] is also mapped to text
       */
      features: {
        type: 'text',
      },
      color: {
        type: 'text',
      },
      icon: {
        type: 'text',
      },
      defaultVISTheme: {
        type: 'text',
      },
    },
  },
};
