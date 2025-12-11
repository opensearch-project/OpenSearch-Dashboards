/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { BaseResourceClient } from './base_resource_client';

export type ResourceClientCreator = (http: HttpSetup) => BaseResourceClient;

export class ResourceClientFactory {
  private http: HttpSetup;
  private resourceClients: Map<string, BaseResourceClient>;
  private resourceClientCreators: Map<string, ResourceClientCreator>;

  constructor(http: HttpSetup) {
    this.http = http;
    this.resourceClients = new Map();
    this.resourceClientCreators = new Map();
  }

  register(dataConnectionType: string, creator: ResourceClientCreator) {
    this.resourceClientCreators.set(dataConnectionType, creator);
  }

  get(dataConnectionType: string) {
    if (!this.resourceClients.has(dataConnectionType)) {
      const creator = this.resourceClientCreators.get(dataConnectionType);
      if (!creator) {
        throw new Error(`Connection type unsupported: ${dataConnectionType}`);
      }
      this.resourceClients.set(dataConnectionType, creator(this.http));
    }

    return this.resourceClients.get(dataConnectionType);
  }
}
