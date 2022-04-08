/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpFetchError } from 'opensearch-dashboards/public';

export interface Services {
  postGeojson: (requestBody: any) => Promise<undefined | HttpFetchError>;
  getIndex: (indexName: string) => Promise<undefined | HttpFetchError>;
}

export function getServices(http: any): Services {
  return {
    postGeojson: async (requestBody: any) => {
      try {
        const response = await http.post('../api/geospatial/_upload', {
          body: requestBody,
        });
        return response;
      } catch (e) {
        return e;
      }
    },
    getIndex: async (indexName: string) => {
      try {
        const response = await http.post('../api/geospatial/_indices', {
          body: JSON.stringify({
            index: indexName,
          }),
        });
        return response;
      } catch (e) {
        return e;
      }
    },
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
  };
}
