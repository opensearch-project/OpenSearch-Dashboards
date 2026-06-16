/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from 'opensearch-dashboards/server';
import { createDataSourceError } from '../lib/error';
import { DataSourceEngineType, SigV4ServiceName } from '../../common/data_sources';
import { DataSourceInfo } from '../types';

export class DataSourceConnectionValidator {
  constructor(
    private readonly callDataCluster: OpenSearchClient,
    private readonly dataSourceAttr: any
  ) {}

  async validate() {
    try {
      let validationResponse;
      // Amazon OpenSearch Serverless does not support .info() API
      if (
        this.dataSourceAttr.auth?.credentials?.service === SigV4ServiceName.OpenSearchServerless
      ) {
        validationResponse = await this.callDataCluster.cat.indices();
        if (validationResponse?.statusCode === 200) {
          return validationResponse;
        }
      } else {
        validationResponse = await this.callDataCluster.info();
        if (validationResponse?.statusCode === 200 && validationResponse?.body?.cluster_name) {
          return validationResponse;
        }
      }

      throw new Error(JSON.stringify(validationResponse?.body));
    } catch (e) {
      throw createDataSourceError(e);
    }
  }

  async fetchDataSourceInfo() {
    const dataSourceInfo: DataSourceInfo = {
      dataSourceVersion: '',
      dataSourceEngineType: DataSourceEngineType.NA,
    };

    try {
      // OpenSearch Serverless does not have version concept
      if (
        this.dataSourceAttr.auth?.credentials?.service === SigV4ServiceName.OpenSearchServerless
      ) {
        dataSourceInfo.dataSourceEngineType = DataSourceEngineType.OpenSearchServerless;
        return dataSourceInfo;
      }

      await this.callDataCluster
        .info()
        // @ts-expect-error TS7006 TODO(ts-upgrade): fixme
        .then((response) => response.body)
        // @ts-expect-error TS7006 TODO(ts-upgrade): fixme
        .then((body) => {
          dataSourceInfo.dataSourceVersion = body.version.number;

          if (
            body.version.distribution !== null &&
            body.version.distribution !== undefined &&
            body.version.distribution === 'opensearch'
          ) {
            dataSourceInfo.dataSourceEngineType = DataSourceEngineType.OpenSearch;
          } else {
            dataSourceInfo.dataSourceEngineType = DataSourceEngineType.Elasticsearch;
          }
        });

      if (
        dataSourceInfo.dataSourceEngineType === DataSourceEngineType.OpenSearch &&
        (await this.isAnalyticEngineDomain())
      ) {
        dataSourceInfo.dataSourceEngineType = DataSourceEngineType.AnalyticEngine;
      }

      return dataSourceInfo;
    } catch (e) {
      // return default dataSourceInfo instead of throwing exception in case info() api call fails
      return dataSourceInfo;
    }
  }

  // Detects AnalyticEngine domains via the persistent cluster setting
  // `cluster.pluggable.dataformat`. An AnalyticEngine domain reports
  // `dataformat=composite` and `dataformat.enabled=true`.
  //
  // Errors (permission denied, network timeout, older cluster without the setting) all
  // resolve to `false`. This is fail-open at registration time: better to register the
  // data source as plain OpenSearch than to fail Test Connection entirely. The trade-off
  // is that a transient error during detection causes the data source to be persisted
  // as OpenSearch; the user can re-run detection by re-saving the data source once the
  // transient condition clears.
  private async isAnalyticEngineDomain(): Promise<boolean> {
    try {
      const response = await this.callDataCluster.cluster.getSettings({
        filter_path: 'persistent.cluster.pluggable*',
      });
      const pluggable = response?.body?.persistent?.cluster?.pluggable;
      return pluggable?.dataformat === 'composite' && pluggable?.['dataformat.enabled'] === 'true';
    } catch (e) {
      return false;
    }
  }

  async fetchInstalledPlugins() {
    const installedPlugins = new Set();
    try {
      // TODO : retrieve installed plugins from OpenSearch Serverless datasource
      if (
        this.dataSourceAttr.auth?.credentials?.service === SigV4ServiceName.OpenSearchServerless
      ) {
        return installedPlugins;
      }

      await this.callDataCluster.cat
        .plugins({
          format: 'JSON',
          v: true,
        })
        // @ts-expect-error TS7006 TODO(ts-upgrade): fixme
        .then((response) => response.body)
        // @ts-expect-error TS7006 TODO(ts-upgrade): fixme
        .then((body) => {
          // @ts-expect-error TS7006 TODO(ts-upgrade): fixme
          body.forEach((plugin) => {
            installedPlugins.add(plugin.component);
          });
        });

      return installedPlugins;
    } catch (e) {
      // return empty installedPlugins instead of throwing exception in case cat.plugins() api call fails
      return installedPlugins;
    }
  }
}
