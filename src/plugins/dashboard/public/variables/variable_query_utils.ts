/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, Query } from '../../../data/public';
import { VariableQueryParams, VariableOptionType } from './types';

/**
 * Adds "source = <dataset>" clause to PPL query if not present.
 * Handles backtick escaping for INDEXES and INDEX_PATTERN dataset types.
 */
function addPPLSourceClause(query: Query): Query {
  const queryString = typeof query.query === 'string' ? query.query : '';
  const lowerCaseQuery = queryString.toLowerCase();
  const hasSource = /^[^|]*\bsource\s*=/.test(lowerCaseQuery);
  const hasDescribe = /^\s*describe\s+/.test(lowerCaseQuery);
  const hasShow = /^\s*show\s+/.test(lowerCaseQuery);

  // Add backticks to dataset type INDEXES or INDEX_PATTERNS
  let datasetTitle: string;
  if (query.dataset && ['INDEXES', 'INDEX_PATTERN'].includes(query.dataset.type)) {
    if (hasSource) {
      // Replace source=anything with source=`anything`
      const updatedQuery = queryString.replace(/(\bsource\s*=\s*)([^`\s][^\s|]*)/gi, '$1`$2`');
      return { ...query, query: updatedQuery };
    }
    datasetTitle = `\`${query.dataset.title}\``;
  } else {
    datasetTitle = query.dataset?.title || '';
  }

  if (hasSource || hasDescribe || hasShow) {
    return { ...query, query: queryString };
  }

  let queryStringWithSource: string;
  if (queryString.trim() === '') {
    queryStringWithSource = `source = ${datasetTitle}`;
  } else {
    queryStringWithSource = `source = ${datasetTitle} ${queryString}`;
  }

  return {
    ...query,
    query: queryStringWithSource,
  };
}

/**
 * Convert a raw field value to string.
 */
function extractValues(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractValues(item));
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }

  return [];
}

/**
 * Parse search response and extract options with their data type.
 * Returns options array and the field type determined from the first value.
 *
 * Response structure:
 * {
 *   hits: {
 *     hits: [
 *       { _source: { field: value } },
 *       { _source: { field: value } },
 *       ...
 *     ]
 *   }
 * }
 */
export function parseResponseToOptionsWithType(
  response: any
): {
  options: string[];
  optionType?: VariableOptionType;
} {
  let optionType: VariableOptionType | undefined;
  const optionsSet = new Set<string>();
  const hits = response?.hits?.hits;

  if (hits && hits.length > 0 && hits[0]?._source && typeof hits[0]?._source === 'object') {
    const field = Object.keys(hits[0]._source)[0];

    // Determine type from the first non-null value
    let firstValue: any;
    for (const hit of hits) {
      const rawValue = hit._source?.[field] ?? hit[field];
      if (rawValue !== null && rawValue !== undefined) {
        // For arrays, get the first element
        firstValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        break;
      }
    }

    // Determine optionType based on the first value's JavaScript type
    if (firstValue !== null && firstValue !== undefined) {
      if (typeof firstValue === 'number') {
        optionType = 'number';
      } else if (typeof firstValue === 'boolean') {
        optionType = 'boolean';
      } else {
        optionType = 'string';
      }
    }
    // Extract all values
    hits.forEach((hit: any) => {
      const rawValue = hit._source?.[field] ?? hit[field];
      const extracted = extractValues(rawValue);
      extracted.forEach((val) => optionsSet.add(val));
    });
  }
  return { options: Array.from(optionsSet), optionType };
}

/**
 * Parse search response hits into a deduplicated string array of options.
 * For backward compatibility.
 */
export function parseResponseToOptions(response: any): string[] {
  return parseResponseToOptionsWithType(response).options;
}

/**
 * Execute a query and return the results with type information.
 *
 * @param dataPlugin - The data plugin instance for creating search sources
 * @param params - Query parameters (query string, language, dataset)
 * @param useTimeFilter - Whether to apply time filter to the query (default: false)
 * @returns Options array and the field type from response schema
 */
export async function executeQueryForOptionsWithType(
  dataPlugin: DataPublicPluginStart,
  params: VariableQueryParams,
  signal?: AbortSignal,
  useTimeFilter: boolean = false
): Promise<{ options: string[]; optionType?: VariableOptionType }> {
  if (!params.query) {
    return { options: [] };
  }

  const searchSource = await dataPlugin.search.searchSource.create();

  // Prepare query for language (adds source clause for PPL if missing)
  let queryObject: Query = {
    query: params.query,
    language: params.language,
    dataset: params.dataset,
  };

  if (params.language === 'PPL' && params.dataset) {
    queryObject = addPPLSourceClause(queryObject);
  }

  searchSource.setField('query', queryObject);

  // Skip dashboard filters for variable queries — variable options should
  // not be narrowed by the current dashboard filter state.
  searchSource.setField('skipFilters', true);

  // By default, skip time filter to get all options across all time ranges.
  // Only apply time filter if explicitly enabled by the variable configuration.
  if (!useTimeFilter) {
    searchSource.setField('skipTimeFilter', true);
  }

  const response = await searchSource.fetch({ abortSignal: signal });
  return parseResponseToOptionsWithType(response);
}

/**
 * Execute a query and return the results as a deduplicated string array of options.
 * For backward compatibility.
 *
 * @param dataPlugin - The data plugin instance for creating search sources
 * @param params - Query parameters (query string, language, dataset)
 * @param useTimeFilter - Whether to apply time filter to the query (default: false)
 * @returns Deduplicated string array of option values
 */
export async function executeQueryForOptions(
  dataPlugin: DataPublicPluginStart,
  params: VariableQueryParams,
  signal?: AbortSignal,
  useTimeFilter: boolean = false
): Promise<string[]> {
  const result = await executeQueryForOptionsWithType(dataPlugin, params, signal, useTimeFilter);
  return result.options;
}

/**
 * Filter options by a regex pattern string.
 * Supports `/pattern/flags` syntax or plain regex string.
 * Returns the original array if regex is empty or invalid.
 */
export function filterOptionsByRegex(options: string[], regex?: string): string[] {
  if (!regex) return options;
  try {
    const match = regex.match(/^\/(.+)\/([gimsuy]*)$/);
    const pattern = match ? new RegExp(match[1], match[2]) : new RegExp(regex);
    return options.filter((opt) => pattern.test(opt));
  } catch {
    return options;
  }
}
