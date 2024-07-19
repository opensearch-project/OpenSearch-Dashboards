/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

export const fetchClusters = async (savedObjectsClient: SavedObjectsClientContract) => {
  return await savedObjectsClient.find({
    type: 'data-source',
    perPage: 10000,
  });
};
