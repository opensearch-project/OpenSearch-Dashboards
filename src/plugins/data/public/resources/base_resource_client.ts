/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';

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
    const response = await this.http.post('/api/enhancements/resources', {
      body: JSON.stringify({
        connection: {
          id: dataConnectionId,
          type: this.dataConnectionType,
        },
        resource: {
          type: resourceType,
          name: resourceName,
        },
      }),
    });
    return response.data;
  }
}
