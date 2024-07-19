/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { RequestHandlerContext, OpenSearchClient, LegacyAPICaller } from 'src/core/server';
import { IOpenSearchSearchRequest } from '../../../data/common';

export const decideClient = async (
  context: RequestHandlerContext,
  request: IOpenSearchSearchRequest,
  withLongNumeralsSupport: boolean = false
): Promise<OpenSearchClient> => {
  const defaultOpenSearchClient = withLongNumeralsSupport
    ? context.core.opensearch.client.asCurrentUserWithLongNumeralsSupport
    : context.core.opensearch.client.asCurrentUser;

  return request.dataSourceId && context.dataSource
    ? await context.dataSource.opensearch.getClient(request.dataSourceId)
    : defaultOpenSearchClient;
};

export const decideLegacyClient = async (
  context: RequestHandlerContext,
  request: any
): Promise<LegacyAPICaller> => {
  const dataSourceId = request.query.data_source;
  return dataSourceId
    ? (context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI as LegacyAPICaller)
    : context.core.opensearch.legacy.client.callAsCurrentUser;
};
