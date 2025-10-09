/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyClusterClient, Logger } from 'opensearch-dashboards/server';
import { DATASET } from '../../common';

/**
 * Cancels a query based on the data source type by calling the appropriate backend API
 *
 * @param queryId - The ID of the query to cancel
 * @param dataSourceType - The type of data source (S3, CLOUDWATCH, etc.)
 * @param client - The OpenSearch client for making API calls
 * @param logger - Logger instance for logging cancellation attempts
 * @param queryLanguage - The query language (SQL, PPL) for logging context
 */
export const cancelQueryByDataSource = async (
  queryId: string,
  dataSourceType: string | undefined,
  client: ILegacyClusterClient,
  logger: Logger,
  queryLanguage: string
): Promise<void> => {
  switch (dataSourceType) {
    case DATASET.S3:
      // S3 queries use OpenSearch async query API
      await client.callAsInternalUser('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      logger.info(`${queryLanguage}AsyncSearchStrategy: Cancelled S3 backend query ${queryId}`);
      break;

    default:
      // Default to OpenSearch async query API for unknown data sources
      await client.callAsInternalUser('transport.request', {
        method: 'POST',
        path: `/_plugins/_async_query/cancel/${queryId}`,
      });
      logger.info(
        `${queryLanguage}AsyncSearchStrategy: Cancelled backend query ${queryId} (default API)`
      );
      break;
  }
};

/**
 * Creates an abort signal event listener that cancels queries based on data source type
 * This is a convenience function for use in search strategies
 *
 * @param queryId - The ID of the query to cancel
 * @param query - The query object containing dataset information
 * @param client - The OpenSearch client for making API calls
 * @param logger - Logger instance for logging cancellation attempts
 * @param queryLanguage - The query language (SQL, PPL) for logging context
 * @returns Promise that resolves when cancellation is complete
 */
export const createQueryCancellationHandler = (
  queryId: string,
  query: any,
  client: ILegacyClusterClient,
  logger: Logger,
  queryLanguage: string
) => {
  return async () => {
    if (queryId) {
      try {
        const dataSourceType = query.dataset?.type;
        await cancelQueryByDataSource(queryId, dataSourceType, client, logger, queryLanguage);
      } catch (error) {
        logger.error(
          `${queryLanguage}AsyncSearchStrategy: Failed to cancel backend query ${queryId}: ${error.message}`
        );
      }
    }
  };
};
