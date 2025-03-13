/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OpenSearchClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { BaseConnectionManager } from './base_connection_manager';
import { ResourcesQuery } from '../clients/base_connection_client';

export class PrometheusManager extends BaseConnectionManager<OpenSearchClient> {
  getResourceURI(resourceType: string): string {
    switch (resourceType) {
      case 'labels':
        return 'resources/api/v1/labels';
      // other types

      default:
        throw Error('unknown resource');
    }
  }

  getResources(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    query: ResourcesQuery
  ) {
    return this.getClient(context, request).getResources({
      query,
      path: `/_directquery/${query.dataSourceName}/${this.getResourceURI(query.resourceType)}`,
      params: {
        querystring: new URLSearchParams(query.query).toString(),
      },
    });
  }
}
