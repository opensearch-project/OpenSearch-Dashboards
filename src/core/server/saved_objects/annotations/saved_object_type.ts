/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SavedObjectsType } from '../types';
import { SAVED_OBJECT_ANNOTATION_TYPE } from '../../../types';

export interface SavedObjectAnnotationAttributes {
  type: string;
  name: string;
  description?: string;
  payload?: string;
}

export const savedObjectAnnotationType: SavedObjectsType = {
  name: SAVED_OBJECT_ANNOTATION_TYPE,
  hidden: false,
  namespaceType: 'single',
  management: {
    icon: 'tag',
    defaultSearchField: 'name',
    importableAndExportable: true,
    getTitle(savedObject) {
      return savedObject.attributes.name;
    },
  },
  mappings: {
    properties: {
      type: { type: 'keyword' },
      name: { type: 'text' },
      description: { type: 'text' },
      payload: { type: 'text', index: false },
    },
  },
};
