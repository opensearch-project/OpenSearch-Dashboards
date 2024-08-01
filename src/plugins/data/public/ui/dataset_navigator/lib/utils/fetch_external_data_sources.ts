/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';
import { DatasourceDetails } from '../types';
import { SimpleDataSource } from 'src/plugins/data/common';

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
) => {
  const results = await Promise.all(
    connectedClusters.map(async (cluster) => {
      let dataSources;
      try {
        //dataSources = await http.get(`api/enhancements/datasource/external/${cluster}`);
        dataSources = await http.get(`../../api/enhancements/datasource/external/${cluster.id}`, {
          query: {
            name: cluster.name,
          },
        });
      } catch {
        return [];
      } finally {
        console.log('dataSources', dataSources);
      }

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
