/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { SimpleDataSource } from '../../../../../common';

export const fetchDataSources = async (client: SavedObjectsClientContract) => {
  const resp = await client.find<any>({
    type: 'data-source',
    perPage: 10000,
  });
  const dataSources: SimpleDataSource[] = [{ id: '', name: 'Local Cluster', type: 'data-source' }];
  return dataSources.concat([
    ...(resp.savedObjects.map((savedObject) => ({
      id: savedObject.id,
      name: savedObject.attributes.title,
      type: 'data-source',
    })) as SimpleDataSource[]),
  ]);
};
