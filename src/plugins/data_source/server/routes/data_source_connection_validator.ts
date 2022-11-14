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
      const req = await getClusterInfo(this.callDataCluster);
      return req;
    } catch (e) {
      throw createDataSourceError(e);
    }
  }
}
