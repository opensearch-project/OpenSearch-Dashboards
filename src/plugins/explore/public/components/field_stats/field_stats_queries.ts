/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { indexPatterns as indexPatternUtils } from '../../../../data/public';
import { ExploreServices } from '../../types';

/**
 * Get total document count for an index
 */
export const getTotalDocCountQuery = (index: string): string => {
  return `source = ${index} | stats count() as total_count`;
};

/**
 * Get basic field statistics (document count, distinct count)
 */
export const getFieldStatsQuery = (index: string, fieldName: string): string => {
  return `source = ${index} | where isnotnull(\`${fieldName}\`) | stats count() as field_count, distinct_count(\`${fieldName}\`) as distinct_count`;
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
    const dataView = await services.data.dataViews.get(datasetId, datasetType !== 'INDEX_PATTERN');
    const filters = services.data.query.filterManager.getFilters();

    const searchSource = await services.data.search.searchSource.create();

    const timeRangeSearchSource = await services.data.search.searchSource.create();
    const { isDefault } = indexPatternUtils;
    if (isDefault(dataView)) {
      const timefilter = services.data.query.timefilter.timefilter;
      timeRangeSearchSource.setField('filter', () => {
        return timefilter.createFilter(dataView);
      });
    }

    searchSource.setParent(timeRangeSearchSource);

    const queryStringWithExecutedQuery = {
      ...services.data.query.queryString.getQuery(),
      query: queryString,
    };

    searchSource.setFields({
      index: dataView,
      size: 0, // only need aggregation results, no hits
      query: queryStringWithExecutedQuery,
      highlightAll: false,
      version: true,
      filter: filters,
    });

    const results = await searchSource.fetch();

    return results;
  } catch (error) {
    throw error;
  }
};
