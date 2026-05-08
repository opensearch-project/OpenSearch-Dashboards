/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { Logger } from 'opensearch-dashboards/server';
import { OpenSearchClient } from 'src/core/server';
import { IndicesGetFieldMappingResponse } from '@opensearch-project/opensearch/api/types';

/**
 * Normalize the time string and only accept the specific formats
 * @param timeString - The time string to normalize
 * @returns The normalized time string or null if the time string is invalid
 */
export function normTimeString(timeString: string): moment.Moment | null {
  if (!timeString) {
    return null;
  }
  // we need to remove all timezone suffixes and view it as a pure time string
  const sanitizedTimeString = timeString.replace(/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i, '');
  const FORMATS = [
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm:ss.SSS',
    'YYYY-MM-DD HH:mm',
    'YYYY/MM/DD HH:mm:ss',
    'YYYY/MM/DD HH:mm:ss.SSS',
    'YYYY/MM/DD HH:mm',
    'YYYY-MM-DD[T]HH:mm:ss',
    'YYYY-MM-DD[T]HH:mm:ss.SSS',
    'YYYY-MM-DD[T]HH:mm',
    'YYYY/MM/DD[T]HH:mm:ss',
    'YYYY/MM/DD[T]HH:mm:ss.SSS',
  ];

  const m = moment(sanitizedTimeString, FORMATS, true);
  if (!m.isValid()) {
    return null;
  }
  return m;
}

/**
 * Parses time range data from XML format
 * Handles various edge cases and validates the time range values
 *
 * @param inputString - The string containing time range data (XML)
 * @param logger - Logger instance for error reporting
 * @returns The parsed time range object with formatted time strings or null if parsing fails
 */
export function parseTimeRangeXML(
  inputString: string,
  logger: Logger
): { start: string; end: string } | null {
  if (!inputString) {
    logger.debug('Empty time range input string provided');
    return null;
  }

  try {
    // Extract start tag content
    const startTagMatch = inputString.match(/<start>(.*?)<\/start>/s);
    const startValue = startTagMatch ? startTagMatch[1].trim() : null;

    // Extract end tag content
    const endTagMatch = inputString.match(/<end>(.*?)<\/end>/s);
    const endValue = endTagMatch ? endTagMatch[1].trim() : null;

    if (!startValue || !endValue) {
      logger.warn('No start or end tags found in XML time range');
      return null;
    }

    const startDate = normTimeString(startValue);
    const endDate = normTimeString(endValue);

    if (!startDate || !endDate) {
      return null;
    }

    if (startDate.isAfter(endDate)) {
      return null;
    }

    return {
      start: startDate.format('YYYY-MM-DD HH:mm:ss'),
      end: endDate.format('YYYY-MM-DD HH:mm:ss'),
    };
  } catch (error) {
    logger.error(`Error parsing time range input: ${error}`);
    return null;
  }
}

interface FieldMappingEntry {
  full_name: string;
  mapping?: Record<string, { type?: string; path?: string }>;
}

function isFieldMappingEntry(value: unknown): value is FieldMappingEntry {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  return 'full_name' in (value as Record<string, unknown>);
}

/**
 * Parses the mapping response and aggregates clusters of date fields and their aliases.
 * Each cluster contains the target date field and all its aliases.
 *
 * @param mappingResponse - The raw mapping response from OpenSearch
 * @returns An array of clusters; each cluster is an array of strings where the first element is the target date field, followed by its aliases
 */
function parseTimestampAliasClusters(mappingResponse: IndicesGetFieldMappingResponse): string[][] {
  const clusterMap: Record<string, Set<string>> = {};
  const dateFields = new Set<string>();
  // Step 1: Find all fields of type 'date' and 'date_nanos', and record alias -> target pointers
  const aliasPointers: Array<[string, string]> = [];
  for (const mappingIndexName in mappingResponse) {
    if (!Object.prototype.hasOwnProperty.call(mappingResponse, mappingIndexName)) continue;
    const { mappings } = mappingResponse[mappingIndexName];
    for (const fieldKey in mappings) {
      if (!Object.prototype.hasOwnProperty.call(mappings, fieldKey)) continue;
      const fieldDefUnknown = mappings[fieldKey] as unknown;
      if (!isFieldMappingEntry(fieldDefUnknown)) continue;
      const fieldMappingEntry = fieldDefUnknown;
      const innerMappings = fieldMappingEntry.mapping ?? {};
      for (const innerFieldName in innerMappings) {
        if (!Object.prototype.hasOwnProperty.call(innerMappings, innerFieldName)) continue;
        const innerMappingsEntry = innerMappings[innerFieldName];
        if (innerMappingsEntry.type === 'date' || innerMappingsEntry.type === 'date_nanos') {
          dateFields.add(fieldMappingEntry.full_name);
          // Initialize cluster for this date field
          if (!clusterMap[fieldMappingEntry.full_name]) {
            clusterMap[fieldMappingEntry.full_name] = new Set([fieldMappingEntry.full_name]);
          }
        }
        if (innerMappingsEntry.type === 'alias' && typeof innerMappingsEntry.path === 'string') {
          // Record alias mapping for later processing
          aliasPointers.push([fieldMappingEntry.full_name, innerMappingsEntry.path]);
        }
      }
    }
  }
  // Step 2: Process recorded alias pointers and map them to date fields
  for (const [aliasField, targetField] of aliasPointers) {
    if (dateFields.has(targetField)) {
      if (!clusterMap[targetField]) {
        clusterMap[targetField] = new Set([targetField]);
      }
      clusterMap[targetField].add(aliasField);
    }
  }
  // Convert clusters from Set<string> to string[][]
  return Object.values(clusterMap).map((set) => Array.from(set));
}

/**
 * Retrieves clusters of timestamp fields (date type and their aliases) from an index using the OpenSearch mapping API
 *
 * @param indexName - The name of the index to query
 * @param client - The OpenSearch client instance
 * @param logger - Logger instance for error reporting
 * @returns Promise resolving to an array of clusters; each cluster is an array of strings where the first element is the original field name, followed by its alias(es).
 * @throws Error if the API call fails or index name is empty
 */
export async function getTimestampFieldClusters(
  indexName: string,
  client: OpenSearchClient,
  logger: Logger
): Promise<string[][]> {
  if (!indexName) {
    const error = new Error('Empty index name provided');
    logger.error(error.message);
    throw error;
  }

  try {
    // Call the mapping API to get all field details
    const response = await client.transport.request({
      method: 'GET',
      path: `/${encodeURIComponent(indexName)}/_mapping/field/*`,
    });

    return parseTimestampAliasClusters(response.body as IndicesGetFieldMappingResponse);
  } catch (error) {
    logger.error(`Error retrieving timestamp field clusters for index ${indexName}: ${error}`);
    throw error;
  }
}

/**
 * Get all time fields (flattened) in the index except the selected field
 * @param params - Parameters for retrieving unselected time fields
 *   - indexName: Index name
 *   - selectedTimeField: The selected time field
 *   - client: OpenSearch client
 *   - logger: Logger
 *   - getTimestampFieldClustersFn: Optional function to get timestamp field clusters (for testing)
 * @returns Promise<string[]> Other time fields
 */
export interface GetUnselectedTimeFieldsParams {
  indexName: string;
  selectedTimeField: string;
  client: OpenSearchClient;
  logger: Logger;
  getTimestampFieldClustersFn?: (
    indexName: string,
    client: OpenSearchClient,
    logger: Logger
  ) => Promise<string[][]>;
}

export async function getUnselectedTimeFields({
  indexName,
  selectedTimeField,
  client,
  logger,
  getTimestampFieldClustersFn,
}: GetUnselectedTimeFieldsParams): Promise<string[]> {
  const getClusters = getTimestampFieldClustersFn || getTimestampFieldClusters;
  const allTimeFields = await getClusters(indexName, client, logger);
  return allTimeFields.filter((cluster) => !cluster.includes(selectedTimeField)).flat();
}
