/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayer, VisLayerErrorTypes } from './types';

export const generateVisLayer = (type: any, error: boolean = false): VisLayer => {
  return {
    type,
    originPlugin: 'test-plugin',
    pluginResource: {
      type: 'test-resource-type',
      id: 'test-resource-id',
      name: 'test-resource-name',
      urlPath: 'test-resource-url-path',
    },
    error: error
      ? {
          type: VisLayerErrorTypes.FETCH_FAILURE,
          message: 'some-error-message',
        }
      : undefined,
  };
};
