/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from 'opensearch-dashboards/server';
import { getClusterInfo } from '../../../telemetry/server';
import { createDataSourceError } from '../lib/error';

export class DataSourceConnectionValidator {
  constructor(private readonly callDataCluster: OpenSearchClient) {}

  async validate() {
    try {
      return await getClusterInfo(this.callDataCluster);
    } catch (e) {
      throw createDataSourceError(e);
    }
  }
}
