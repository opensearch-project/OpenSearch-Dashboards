/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient, RequestHandlerContext } from 'src/core/server';
import { IOpenSearchSearchRequest } from '..';

export const decideClient = async (
  context: RequestHandlerContext,
  request: IOpenSearchSearchRequest,
  withDataSourceEnabled: boolean = false,
  withLongNumeralsSupport: boolean = false
): Promise<OpenSearchClient> => {
  const defaultOpenSearchClient = withLongNumeralsSupport
    ? context.core.opensearch.client.asCurrentUserWithLongNumeralsSupport
    : context.core.opensearch.client.asCurrentUser;

  return withDataSourceEnabled && request.dataSourceId && context.dataSource
    ? await context.dataSource.opensearch.getClient(request.dataSourceId)
    : defaultOpenSearchClient;
};
