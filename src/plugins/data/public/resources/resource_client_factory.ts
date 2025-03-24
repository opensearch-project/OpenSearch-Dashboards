/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { PrometheusResourceClient } from './prometheus_resource_client';

type DataConnectionType = 'prometheus';

export class ResourceClientFactory {
  private http: HttpSetup;

  constructor(http: HttpSetup) {
    this.http = http;
  }

  create(dataConnectionType: DataConnectionType) {
    switch (dataConnectionType) {
      case 'prometheus':
        return new PrometheusResourceClient(this.http);
      default:
        throw new Error(`Connection type unsupported: ${dataConnectionType}`);
    }
  }
}
