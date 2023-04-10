/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, HttpFetchError } from 'opensearch-dashboards/public';

export interface Services {
  getCustomIndices: () => Promise<undefined | HttpFetchError>;
  getIndexData: (indexName: string, size: number) => Promise<undefined | HttpFetchError>;
  getIndexMapping: (indexName: string) => Promise<undefined | HttpFetchError>;
}

export function getServices(http: CoreStart['http']): Services {
  return {
    getCustomIndices: async () => {
      try {
        const response = await http.post('../api/geospatial/_indices', {
          body: JSON.stringify({
            index: '*-map',
          }),
        });
        return response;
      } catch (e) {
        return e;
      }
    },
    getIndexData: async (indexName: string, size: number) => {
      try {
        const response = await http.post('../api/geospatial/_search', {
          body: JSON.stringify({
            index: indexName,
            size,
          }),
        });
        return response;
      } catch (e) {
        return e;
      }
    },
    getIndexMapping: async (indexName: string) => {
      try {
        const response = await http.post('../api/geospatial/_mappings', {
          body: JSON.stringify({
            index: indexName,
          }),
        });
        return response;
      } catch (e) {
        return e;
      }
    },
  };
}
