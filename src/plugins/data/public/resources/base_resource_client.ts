/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';

const BASE_API = 'api/enhancements';

export class BaseResourceClient {
  private http: HttpSetup;
  private dataConnectionType: string;

  constructor(http: HttpSetup, dataConnectionType: string) {
    this.http = http;
    this.dataConnectionType = dataConnectionType;
  }

  protected async get<T>(
    dataConnectionId: string,
    resourceType: string,
    resourceName?: string
  ): Promise<T> {
    const resourceNameSuffix = resourceName ? `/${resourceName}` : '';
    const path = `/${BASE_API}/${this.dataConnectionType}/${dataConnectionId}/resources/${resourceType}${resourceNameSuffix}`;
    const response = await this.http.get(path);
    return response.data;
  }
}
