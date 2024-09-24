/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';
import { DatasourceDetails } from '../types';

export const fetchIfExternalDataSourcesEnabled = async (http: HttpStart) => {
  try {
    await http.get('/api/dataconnections');
    return true;
  } catch (e) {
    return false;
  }
};

export const fetchExternalDataSources = async (http: HttpStart, connectedClusters: string[]) => {
  const results = await Promise.all(
    connectedClusters.map(async (cluster) => {
      const dataSources = await http.get(`/api/dataconnections/dataSourceMDSId=${cluster}`);
      return dataSources
        .filter((dataSource: DatasourceDetails) => dataSource.connector === 'S3GLUE')
        .map((dataSource: DatasourceDetails) => ({
          name: dataSource.name,
          status: dataSource.status,
          dataSourceRef: cluster,
        }));
    })
  );

  const flattenedResults = results.flat();
  const uniqueResults = Array.from(
    flattenedResults
      .reduce((map, ds) => {
        const key = `${ds.name}-${ds.status}`;
        if (!map.has(key) || ds.dataSourceRef === '') {
          map.set(key, ds);
        }
        return map;
      }, new Map<string, any>())
      .values()
  );

  return uniqueResults;
};
