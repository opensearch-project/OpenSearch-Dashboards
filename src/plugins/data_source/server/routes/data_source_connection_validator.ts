/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from 'opensearch-dashboards/server';
import { createDataSourceError } from '../lib/error';
import { SigV4ServiceName } from '../../common/data_sources';
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

  async fetchDataSourceVersion() {
    let dataSourceVersion = '';
    try {
      // OpenSearch Serverless does not have version concept
      if (
        this.dataSourceAttr.auth?.credentials?.service === SigV4ServiceName.OpenSearchServerless
      ) {
        return dataSourceVersion;
      }
      await this.callDataCluster
        .info()
        .then((response) => response.body)
        .then((body) => {
          dataSourceVersion = body.version.number;
        });

      return dataSourceVersion;
    } catch (e) {
      // return empty dataSource version instead of throwing exception in case info() api call fails
      return dataSourceVersion;
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
        .then((response) => response.body)
        .then((body) => {
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
