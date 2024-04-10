/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestHandlerContext } from 'src/core/server';

export const decideLegacyClient = (
  requestContext: RequestHandlerContext,
  dataSourceId: string | null
) => {
  return !!dataSourceId && !!requestContext.dataSource
    ? requestContext.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI
    : requestContext.core.opensearch.legacy.client.callAsCurrentUser;
};
