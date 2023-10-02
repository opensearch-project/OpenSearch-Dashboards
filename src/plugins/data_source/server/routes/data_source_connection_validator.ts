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
      // Amazon OpenSearch Serverless does not support .info() API
      if (this.dataSourceAttr.auth?.credentials?.service === SigV4ServiceName.OpenSearchServerless)
        return await this.callDataCluster.cat.indices();
      return await this.callDataCluster.info();
    } catch (e) {
      throw createDataSourceError(e);
    }
  }
}
