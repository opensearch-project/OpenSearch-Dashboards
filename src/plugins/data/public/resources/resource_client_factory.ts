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
  private datasetTypeClients: Map<string, string>;

  constructor(http: HttpSetup) {
    this.http = http;
    this.resourceClients = new Map();
    this.resourceClientCreators = new Map();
    this.datasetTypeClients = new Map();
  }

  register(dataConnectionType: string, creator: ResourceClientCreator) {
    this.resourceClientCreators.set(dataConnectionType, creator);
  }

  get<T = BaseResourceClient>(dataConnectionType: string): T | undefined {
    if (!this.resourceClients.has(dataConnectionType)) {
      const creator = this.resourceClientCreators.get(dataConnectionType);
      if (!creator) {
        throw new Error(`Connection type unsupported: ${dataConnectionType}`);
      }
      this.resourceClients.set(dataConnectionType, creator(this.http));
    }

    return this.resourceClients.get(dataConnectionType) as T | undefined;
  }

  /**
   * Names the resource client that serves a dataset type's resources (e.g. the metrics, labels
   * and label values PromQL autocomplete lists), for dataset types whose client isn't the one
   * their language would otherwise use.
   */
  setClientForDatasetType(datasetType: string, dataConnectionType: string) {
    this.datasetTypeClients.set(datasetType, dataConnectionType);
  }

  /**
   * The resource client for a dataset type: the one set with `setClientForDatasetType`, else
   * `fallback`. Undefined, rather than an error, when that client isn't registered.
   */
  getForDatasetType<T = BaseResourceClient>(
    datasetType: string | undefined,
    fallback: string
  ): T | undefined {
    const id = (datasetType && this.datasetTypeClients.get(datasetType)) || fallback;
    if (!this.resourceClientCreators.has(id) && !this.resourceClients.has(id)) return undefined;
    return this.get<T>(id);
  }
}
