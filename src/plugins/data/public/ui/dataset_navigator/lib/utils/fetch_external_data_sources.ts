/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';
import { CachedDataSourceStatus, DatasourceDetails, ExternalDataSource } from '../types';
import { SimpleDataSource } from '../../../../../common';

export const fetchIfExternalDataSourcesEnabled = async (http: HttpStart) => {
  try {
    await http.get('/api/enhancements/datasource/external');
    return true;
  } catch (e) {
    return false;
  }
};

export const fetchExternalDataSources = async (
  http: HttpStart,
  connectedClusters: SimpleDataSource[]
): Promise<ExternalDataSource[]> => {
  let externalDataSources: ExternalDataSource[] = [];

  for (const cluster of connectedClusters) {
    try {
      const response = await http.fetch(`../../api/enhancements/datasource/external`, {
        query: {
          id: cluster.id,
        },
      });

      const clusterDataSources = response
        .filter((dataSource: DatasourceDetails) => dataSource.connector === 'S3GLUE')
        .map((dataSource: DatasourceDetails) => ({
          name: dataSource.name,
          // status: dataSource.status,
          dataSourceRef: cluster.id,
          status: CachedDataSourceStatus.Empty,
        }));

      externalDataSources = externalDataSources.concat(clusterDataSources);
    } catch (error) {
      // Ignore error and continue with the next cluster
    }
  }

  const flattenedResults = externalDataSources.flat();
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
