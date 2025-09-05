/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';

/**
 * Normalize the time string to the format of "yyyy-MM-dd HH:mm:ss"
 * @param timeString - The time string to normalize
 * @returns The normalized time string or null if the time string is invalid
 */
export function normTimeString(timeString: string): string | null {
  if (!timeString) {
    return null;
  }

  const dateTimeRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?.*$/;
  const match = timeString.match(dateTimeRegex);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = '00'] = match;

  const pad = (n: number) => String(n).padStart(2, '0');
  const YYYY = year;
  const MM = pad(parseInt(month, 10));
  const DD = pad(parseInt(day, 10));
  const hh = pad(parseInt(hour, 10));
  const mm = pad(parseInt(minute, 10));
  const ss = pad(parseInt(second, 10));

  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
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

    if (startDate >= endDate) {
      return null;
    }

    return { start: startDate, end: endDate };
  } catch (error) {
    logger.error(`Error parsing time range input: ${error}`);
    return null;
  }
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
  client: any,
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
      path: `/${indexName}/_mapping/field/*`,
    });

    /**
     * Parses the mapping response and aggregates clusters of date fields and their aliases.
     * Each cluster contains the target date field and all its aliases.
     *
     * @param mappingResponse - The raw mapping response from OpenSearch
     * @returns An array of clusters; each cluster is an array of strings where the first element is the target date field, followed by its aliases
     */
    function parseTimestampAliasClusters(mappingResponse: any): string[][] {
      const clusterMap: Record<string, Set<string>> = {};
      const dateFields = new Set<string>();
      // Step 1: Find all fields of type 'date' and 'date_nanos'
      for (const mappingIndexName in mappingResponse) {
        if (!Object.prototype.hasOwnProperty.call(mappingResponse, mappingIndexName)) continue;
        const { mappings } = mappingResponse[mappingIndexName];
        for (const fieldKey in mappings) {
          if (!Object.prototype.hasOwnProperty.call(mappings, fieldKey)) continue;
          const fieldDef = mappings[fieldKey];
          const innerMappings = fieldDef.mapping ?? {};
          for (const innerFieldName in innerMappings) {
            if (!Object.prototype.hasOwnProperty.call(innerMappings, innerFieldName)) continue;
            const def = innerMappings[innerFieldName];
            if (def.type === 'date' || def.type === 'date_nanos') {
              dateFields.add(fieldDef.full_name);
              // Initialize cluster for this date field
              if (!clusterMap[fieldDef.full_name]) {
                clusterMap[fieldDef.full_name] = new Set([fieldDef.full_name]);
              }
            }
          }
        }
      }
      // Step 2: Find all fields of type 'alias' that point to a date field
      for (const mappingIndexName in mappingResponse) {
        if (!Object.prototype.hasOwnProperty.call(mappingResponse, mappingIndexName)) continue;
        const { mappings } = mappingResponse[mappingIndexName];
        for (const fieldKey in mappings) {
          if (!Object.prototype.hasOwnProperty.call(mappings, fieldKey)) continue;
          const fieldDef = mappings[fieldKey];
          const innerMappings = fieldDef.mapping ?? {};
          for (const innerFieldName in innerMappings) {
            if (!Object.prototype.hasOwnProperty.call(innerMappings, innerFieldName)) continue;
            const def = innerMappings[innerFieldName];
            if (def.type === 'alias' && typeof def.path === 'string') {
              const targetField = def.path;
              const aliasField = fieldDef.full_name;
              if (dateFields.has(targetField)) {
                if (!clusterMap[targetField]) {
                  clusterMap[targetField] = new Set([targetField]);
                }
                clusterMap[targetField].add(aliasField);
              }
            }
          }
        }
      }
      // Convert clusters from Set<string> to string[][]
      return Object.values(clusterMap).map((set) => Array.from(set));
    }

    return parseTimestampAliasClusters(response.body);
  } catch (error) {
    logger.error(`Error retrieving timestamp field clusters for index ${indexName}: ${error}`);
    throw error;
  }
}

/**
 * Get all time fields (flattened) in the index except the selected field
 * @param indexName - Index name
 * @param selectedTimeField - The selected time field
 * @param client - OpenSearch client
 * @param logger - Logger
 * @param getTimestampFieldClustersFn - Optional function to get timestamp field clusters (for testing)
 * @returns Promise<string[]> Other time fields
 */
export async function getOtherTimeFields(
  indexName: string,
  selectedTimeField: string,
  client: any,
  logger: Logger,
  getTimestampFieldClustersFn?: (
    indexName: string,
    client: any,
    logger: Logger
  ) => Promise<string[][]>
): Promise<string[]> {
  const getClusters = getTimestampFieldClustersFn || getTimestampFieldClusters;
  const allTimeFields = await getClusters(indexName, client, logger);
  return allTimeFields.filter((cluster) => !cluster.includes(selectedTimeField)).flat();
}
