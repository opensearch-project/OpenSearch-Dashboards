/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { IIndexPattern } from '../..';

export const fetchIndexPatterns = async (client: SavedObjectsClientContract, search: string) => {
  const resp = await client.find<IIndexPattern>({
    type: 'index-pattern',
    fields: ['title'],
    search: `${search}*`,
    searchFields: ['title'],
    perPage: 100,
  });
  return resp.savedObjects.map((savedObject) => ({
    id: savedObject.id,
    title: savedObject.attributes.title,
    dataSourceId: savedObject.references[0]?.id,
  }));
};
