/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { IIndexPattern } from '../.././../..';
import { SIMPLE_DATA_SOURCE_TYPES, SIMPLE_DATA_SET_TYPES } from '../../../../../common';

export const fetchIndexPatterns = async (client: SavedObjectsClientContract, search: string) => {
  const resp = await client.find<IIndexPattern>({
    type: 'index-pattern',
    fields: ['title', 'timeFieldName', 'references', 'fields'],
    search: `${search}*`,
    searchFields: ['title'],
    perPage: 100,
  });
  return resp.savedObjects.map((savedObject) => ({
    id: savedObject.id,
    title: savedObject.attributes.title,
    timeFieldName: savedObject.attributes.timeFieldName,
    fields: savedObject.attributes.fields,
    type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
    ...(savedObject.references[0]
      ? {
          dataSourceRef: {
            id: savedObject.references[0]?.id,
            name: savedObject.references[0]?.name,
            type: SIMPLE_DATA_SOURCE_TYPES.DEFAULT,
          },
        }
      : {}),
  }));
};
