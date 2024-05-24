/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, HttpFetchError } from 'opensearch-dashboards/public';

export interface Services {
  getCustomIndices: (dataSourceRefId: string) => Promise<undefined | HttpFetchError>;
  getIndexData: (
    indexName: string,
    size: number,
    dataSourceRefId: string
  ) => Promise<undefined | HttpFetchError>;
  getIndexMapping: (
    indexName: string,
    dataSourceRefId: string
  ) => Promise<undefined | HttpFetchError>;
}

export function getServices(http: CoreStart['http']): Services {
  return {
    getCustomIndices: async (dataSourceRefId: string) => {
      try {
        return await http.post('../api/geospatial/_indices', {
          body: JSON.stringify({
            index: '*-map',
          }),
          query: { dataSourceId: dataSourceRefId },
        });
      } catch (e) {
        return e;
      }
    },
    getIndexData: async (indexName: string, size: number, dataSourceRefId: string) => {
      try {
        return await http.post('../api/geospatial/_search', {
          body: JSON.stringify({
            index: indexName,
            size,
          }),
          query: { dataSourceId: dataSourceRefId },
        });
      } catch (e) {
        return e;
      }
    },
    getIndexMapping: async (indexName: string, dataSourceRefId: string) => {
      try {
        return await http.post('../api/geospatial/_mappings', {
          body: JSON.stringify({
            index: indexName,
          }),
          query: { dataSourceId: dataSourceRefId },
        });
      } catch (e) {
        return e;
      }
    },
  };
}
