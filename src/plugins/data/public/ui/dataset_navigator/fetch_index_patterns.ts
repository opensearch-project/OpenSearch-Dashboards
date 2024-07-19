/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

export const fetchIndexPatterns = async (
  client: SavedObjectsClientContract,
  search: string,
  fields: string[]
) => {
  const resp = await client.find({
    type: 'index-pattern',
    fields,
    search: `${search}*`,
    searchFields: ['title'],
    perPage: 100,
  });
  return resp.savedObjects;
};
