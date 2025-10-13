/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from 'src/plugins/data/common';
import { ExploreServices } from '../../types';

/**
 * Get basic field statistics (document count, distinct count, percentage)
 */
export const getFieldStatsQuery = (index: string, fieldName: string): string => {
  return `source = ${index}
    | stats count(\`${fieldName}\`) as count,
            distinct_count_approx(\`${fieldName}\`) as dc,
            count() as total_count
    | eval percentage_total = (count * 100.0) / total_count`;
};

/**
 * Execute a PPL query and return the results
 * @param services OpenSearch Dashboards services containing data plugin
 * @param queryString The PPL query string to execute
 * @param datasetId The dataset ID (index pattern ID)
 * @param datasetType The type of dataset (default: 'INDEX_PATTERN')
 * @returns Promise resolving to the query results
 * @throws Error if query execution fails
 */
export const executeFieldStatsQuery = async (
  services: ExploreServices,
  queryString: string,
  datasetId: string,
  datasetType: string = 'INDEX_PATTERN'
): Promise<any> => {
  try {
    // Create searchSource
    const searchSource = await services.data.search.searchSource.create();

    // Get the dataView from the dataset
    const dataView = await services.data.dataViews.get(datasetId, datasetType !== 'INDEX_PATTERN');

    // Get filters and settings
    const filters = services.data.query.filterManager.getFilters();

    // Create query object with PPL query string
    const queryObject: Query = {
      query: queryString,
      language: 'PPL',
    };

    // Set searchSource fields
    searchSource.setFields({
      index: dataView,
      size: 0, // We only need aggregation results, not hits
      query: queryObject,
      highlightAll: false,
      version: true,
      filter: filters,
    });

    // Execute the query
    const results = await searchSource.fetch();

    return results;
  } catch (error) {
    throw error;
  }
};
