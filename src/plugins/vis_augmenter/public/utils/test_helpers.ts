/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { VisLayer, VisLayerErrorTypes } from '../types';

export const generateVisLayer = (
  type: any,
  error: boolean = false,
  errorMessage: string = 'some-error-message',
  resource?: {
    type?: string;
    id?: string;
    name?: string;
    urlPath?: string;
  }
): VisLayer => {
  return {
    type,
    originPlugin: 'test-plugin',
    pluginResource: {
      type: get(resource, 'type', 'test-resource-type'),
      id: get(resource, 'id', 'test-resource-id'),
      name: get(resource, 'name', 'test-resource-name'),
      urlPath: get(resource, 'urlPath', 'test-resource-url-path'),
    },
    error: error
      ? {
          type: VisLayerErrorTypes.FETCH_FAILURE,
          message: errorMessage,
        }
      : undefined,
  };
};
