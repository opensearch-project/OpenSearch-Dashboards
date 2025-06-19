/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch } from 'redux';
import { saveAs } from 'file-saver';
import { createTabCacheKey } from './query_actions';

/**
 * Redux Thunk for exporting data to CSV
 * Uses existing results from the Redux store
 */
export const exportToCsv = (options: { fileName?: string; services?: any } = {}) => {
  return (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const { activeTabId } = state.ui;
    const query = state.query; // Now query state is flattened
    const services = options.services; // Services now passed as parameter

    if (!services) {
      return;
    }

    // Get tab definition
    const tabDefinition = services.tabRegistry?.getTab?.(activeTabId);

    // Prepare query for the tab
    const preparedQuery = tabDefinition?.prepareQuery ? tabDefinition.prepareQuery(query) : query;

    // Get current time range
    const timeRange = services.data.query.timefilter.timefilter.getTime();

    // Create cache key
    const cacheKey = createTabCacheKey(preparedQuery, timeRange);

    // Get results from cache
    const results = state.results[cacheKey];

    if (!results || !results.hits || !results.hits.hits) {
      throw new Error('No results available for export');
    }

    // Get rows from results
    const rows = results.hits.hits;

    // Get index pattern
    const indexPattern = preparedQuery.dataset || services.data.indexPattern;

    // Get columns from legacy state
    const columns = state.legacy?.columns || [];

    // Generate CSV
    const csv = generateCsv(rows, indexPattern, columns);

    // Download CSV
    const fileName = options.fileName || `explore_export_${new Date().toISOString()}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, fileName);
  };
};

/**
 * Helper function to generate CSV from search results
 */
function generateCsv(rows: any[], indexPattern: any, columns: string[]) {
  // Get field names from columns or all fields if no columns specified
  const fieldNames = columns.length > 0 ? columns : Object.keys(indexPattern.fields);

  // Create header row
  const header = fieldNames.join(',');

  // Create data rows
  const dataRows = rows.map((row) => {
    const flattenedRow = indexPattern.flattenHit(row);
    return fieldNames
      .map((field) => {
        const value = flattenedRow[field];
        // Handle special characters in CSV
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value !== undefined ? value : '';
      })
      .join(',');
  });

  // Combine header and data rows
  return [header, ...dataRows].join('\n');
}

/**
 * Redux Thunk for exporting data to CSV with a maximum size
 * Creates a new SearchSource to fetch more data than is in the cache
 */
export const exportMaxSizeCsv = (
  options: { maxSize?: number; fileName?: string; services?: any } = {}
) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const { activeTabId } = state.ui;
    const query = state.query; // Now query state is flattened
    const services = options.services; // Services now passed as parameter

    if (!services) {
      return;
    }

    // Get tab definition
    const tabDefinition = services.tabRegistry?.getTab?.(activeTabId);

    // Prepare query for the tab
    const preparedQuery = tabDefinition?.prepareQuery ? tabDefinition.prepareQuery(query) : query;

    try {
      // Create new SearchSource for export
      const searchSource = await services.data.search.searchSource.create();

      // Configure SearchSource
      const indexPattern = preparedQuery.dataset || services.data.indexPattern;
      const timeRangeFilter = services.data.query.timefilter.timefilter.createFilter(indexPattern);

      searchSource
        .setField('index', indexPattern)
        .setField('query', {
          query: preparedQuery.query,
          language: preparedQuery.language,
          dataset: preparedQuery.dataset,
        })
        .setField('filter', timeRangeFilter ? [timeRangeFilter] : [])
        .setField('size', options.maxSize || 500);

      // Execute query
      const results = await searchSource.fetch();

      // Get rows from results
      const rows = results.hits.hits;

      // Get columns from legacy state
      const columns = state.legacy?.columns || [];

      // Generate CSV
      const csv = generateCsv(rows, indexPattern, columns);

      // Download CSV
      const fileName = options.fileName || `explore_export_${new Date().toISOString()}.csv`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, fileName);
    } catch (error) {
      // Error exporting CSV
      throw error;
    }
  };
};
