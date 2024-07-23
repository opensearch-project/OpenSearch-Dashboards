/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';

export const fetchIfExternalDataSourcesEnabled = async (http: HttpStart) => {
  try {
    const resp = await http.head('/api/dataconnections');
    return resp.status === 200;
  } catch (e) {
    return false;
  }
};

export const fetchExternalDataSources = async (http: HttpStart, connectedClusters: string[]) => {
  const results = await Promise.all(
    connectedClusters.map(async (cluster) => {
      const dataSources = await http.get(`/api/dataconnections/dataSourceMDSId=${cluster}`);
      return dataSources
        .filter((dataSource) => dataSource.connector === 'S3GLUE')
        .map((dataSource) => ({
          name: dataSource.name,
          status: dataSource.status,
          dataSourceRef: cluster,
        }));
    })
  );

  const flattenedResults = results.flat();
  return flattenedResults;
};
