/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

export const fetchDataSources = async (client: SavedObjectsClientContract) => {
  const resp = await client.find<any>({
    type: 'data-source',
    perPage: 10000,
  });
  return resp.savedObjects.map((savedObject) => ({
    id: savedObject.id,
    name: savedObject.attributes.title,
    type: 'data-source',
  }));
};
