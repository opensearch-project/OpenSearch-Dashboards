/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../data/public';
import { VariableQueryParams } from './types';

/**
 * Convert a raw field value to one or more string options.
 */
function extractValues(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    // Flatten arrays — each element becomes a separate option
    return value.flatMap((item) => extractValues(item));
  }

  if (typeof value === 'string') {
    return value ? [value] : [];
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    // Variable options are always strings. Numeric and boolean field values
    // from query results (e.g. status codes like 200, or flags like true)
    // are converted to their string representation so they can be displayed
    // in the variable dropdown and used in query interpolation.
    return [String(value)];
  }

  return [];
}

/**
 * Parse search response hits into a deduplicated string array of options.
 * Extracts the first field from _source of each hit.
 *
 * Supports various field value types:
 * - Strings, numbers, booleans → converted to string
 * - Arrays → flattened, each element becomes a separate option
 * - Objects, null, undefined → skipped
 */
export function parseResponseToOptions(response: any): string[] {
  const options: string[] = [];
  const hits = response?.hits?.hits;

  if (hits && hits.length > 0 && hits[0]?._source && typeof hits[0]?._source === 'object') {
    const field = Object.keys(hits[0]._source)[0];
    hits.forEach((hit: any) => {
      const rawValue = hit._source?.[field] ?? hit[field];
      const extracted = extractValues(rawValue);
      options.push(...extracted);
    });
  }

  return [...new Set(options)];
}

/**
 * Execute a query and return the results as a deduplicated string array of options.
 *
 * @param dataPlugin - The data plugin instance for creating search sources
 * @param params - Query parameters (query string, language, dataset)
 * @returns Deduplicated string array of option values
 */
export async function executeQueryForOptions(
  dataPlugin: DataPublicPluginStart,
  params: VariableQueryParams,
  signal?: AbortSignal
): Promise<string[]> {
  if (!params.query) {
    return [];
  }

  const searchSource = await dataPlugin.search.searchSource.create();

  searchSource.setField('query', {
    query: params.query,
    language: params.language,
    dataset: params.dataset,
  });

  // Skip dashboard filters for variable queries — variable options should
  // not be narrowed by the current dashboard filter state.
  searchSource.setField('skipFilters', true);

  const response = await searchSource.fetch({ abortSignal: signal });
  return parseResponseToOptions(response);
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
