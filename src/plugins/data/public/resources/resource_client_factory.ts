/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { PrometheusResourceClient } from './prometheus_resource_client';
import { BaseResourceClient } from './base_resource_client';

type DataConnectionType = 'prometheus';

export class ResourceClientFactory {
  private http: HttpSetup;
  private resourceClients: Map<DataConnectionType, BaseResourceClient>;

  constructor(http: HttpSetup) {
    this.http = http;
    this.resourceClients = new Map();
  }

  get(dataConnectionType: DataConnectionType) {
    if (!this.resourceClients.has(dataConnectionType)) {
      switch (dataConnectionType) {
        case 'prometheus':
          this.resourceClients.set(dataConnectionType, new PrometheusResourceClient(this.http));
          break;
        default:
          throw new Error(`Connection type unsupported: ${dataConnectionType}`);
      }
    }

    return this.resourceClients.get(dataConnectionType);
  }
}
