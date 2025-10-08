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
            dc(\`${fieldName}\`) as dc,
            count() as total_count
    | eval percentage_total = (count * 100.0) / total_count`;
};

/**
 * Get top values for a field
 */
export const getFieldTopValuesQuery = (
  index: string,
  fieldName: string,
  limit: number = 10
): string => {
  return `source = ${index} | top ${limit} \`${fieldName}\``;
};

/**
 * Get summary statistics for numeric fields
 */
export const getFieldSummaryQuery = (index: string, fieldName: string): string => {
  return `source = ${index}
    | stats min(\`${fieldName}\`) as min,
            percentile(\`${fieldName}\`, 50) as median,
            avg(\`${fieldName}\`) as avg,
            max(\`${fieldName}\`) as max`;
};

/**
 * Get date range for timestamp fields
 */
export const getFieldDateRangeQuery = (index: string, fieldName: string): string => {
  return `source = ${index}
    | stats min(\`${fieldName}\`) as earliest,
            max(\`${fieldName}\`) as latest`;
};

/**
 * Get example values for other field types
 */
export const getFieldExamplesQuery = (index: string, fieldName: string): string => {
  return `source = ${index}
    | head 10
    | fields \`${fieldName}\`
    | where isnotnull(\`${fieldName}\`)`;
};

/**
 * Execute a PPL query and return the results
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
    // TODO: put in a UI error state that covers the field row or extended row panel
  }
};
