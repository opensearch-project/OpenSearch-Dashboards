/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from 'opensearch-dashboards/server';
import { createDataSourceError } from '../lib/error';

export class DataSourceConnectionValidator {
  constructor(private readonly callDataCluster: OpenSearchClient) {}

  async validate() {
    try {
      return await this.callDataCluster.info<OpenSearchClient>();
    } catch (e) {
      throw createDataSourceError(e);
    }
  }
}
