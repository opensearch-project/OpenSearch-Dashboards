/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLService } from './ppl_request_helpers';

export interface LogsRequestParams {
  traceId: string;
  dataSourceId: string;
  pplService: PPLService;
}

// Check if index pattern exists
const checkIndexExists = async (
  pplService: PPLService,
  dataSourceId: string,
  indexPattern: string
): Promise<boolean> => {
  try {
    // Use a simple query to check if the index exists
    const testQuery = `source = ${indexPattern} | head 1`;
    await pplService.executeQuery(dataSourceId, indexPattern, testQuery);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Index pattern ${indexPattern} not found or inaccessible:`, error);
    return false;
  }
};

export const fetchLogsData = async ({
  traceId,
  dataSourceId,
  pplService,
}: LogsRequestParams): Promise<any> => {
  if (!pplService || !traceId || !dataSourceId) {
    throw new Error('Missing required parameters for log fetch');
  }

  const indexPattern = 'logs-otel-v1-*';

  try {
    // First check if the index exists
    const indexExists = await checkIndexExists(pplService, dataSourceId, indexPattern);

    if (!indexExists) {
      // eslint-disable-next-line no-console
      console.warn(`Logs index pattern ${indexPattern} does not exist or is not accessible`);
      // Return empty result structure instead of throwing an error
      return {
        datarows: [],
        schema: [],
        total: 0,
      };
    }

    // Build the PPL query for logs
    const pqlQuery = `source = ${indexPattern} | where traceId = "${traceId}"`;

    // Execute using the generic executeQuery method from PPLService
    const response = await pplService.executeQuery(dataSourceId, indexPattern, pqlQuery);
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('PPL Logs Query Error:', error);

    // Check if it's an index-related error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes('index_not_found') ||
      errorMessage.includes('no such index') ||
      errorMessage.includes('IndexNotFoundException')
    ) {
      // eslint-disable-next-line no-console
      console.warn(`Logs index ${indexPattern} not found, returning empty results`);
      return {
        datarows: [],
        schema: [],
        total: 0,
      };
    }

    // Re-throw other errors
    throw error;
  }
};
