/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient, RequestHandlerContext } from 'src/core/server';
import { IOpenSearchSearchRequest } from '..';

export const decideClient = async (
  context: RequestHandlerContext,
  request: IOpenSearchSearchRequest
): Promise<OpenSearchClient> => {
  // if data source feature is disabled, return default opensearch client of current user
  const client =
    request.dataSourceId && context.dataSource
      ? await context.dataSource.opensearch.getClient(request.dataSourceId)
      : context.core.opensearch.client.asCurrentUser;
  return client;
};
