/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayer, VisLayerErrorTypes } from './types';

export const generateVisLayer = (
  type: any,
  error: boolean = false,
  resourceType: string = 'test-resource-type',
  resourceID: string = 'test-resource-id',
  resourceName: string = 'test-resource-name',
  errorMessage: string = 'some-error-message'
): VisLayer => {
  return {
    type,
    originPlugin: 'test-plugin',
    pluginResource: {
      type: resourceType,
      id: resourceID,
      name: resourceName,
      urlPath: 'test-resource-url-path',
    },
    error: error
      ? {
          type: VisLayerErrorTypes.FETCH_FAILURE,
          message: errorMessage,
        }
      : undefined,
  };
};
