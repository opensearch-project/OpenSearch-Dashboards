/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LogEntry {
  '@timestamp': string;
  time: string;
  spanId: string;
  severityText: string;
  severityNumber: number;
  body: string;
  traceId: string;
  attributes: any;
  resource: any;
  instrumentationScope: any;
  [key: string]: any;
}

export interface ParsedLogHit {
  _index: string;
  _id: string;
  _score: number;
  _source: LogEntry;
  sort?: any[];
}

export const parseLogHits = (responseData: any): ParsedLogHit[] => {
  try {
    // Handle nested structure with body property (fields format)
    let actualData = responseData;
    if (responseData?.type === 'data_frame' && responseData?.body) {
      actualData = responseData.body;
    }

    if (actualData?.fields && Array.isArray(actualData.fields) && actualData.size > 0) {
      const fields = actualData.fields;
      const size = actualData.size;

      // Create a map of field names to their values arrays
      const fieldMap = new Map<string, any[]>();
      fields.forEach((field: any) => {
        fieldMap.set(field.name, field.values);
      });

      const hits: ParsedLogHit[] = [];

      // Process each row (log entry)
      for (let i = 0; i < size; i++) {
        const source: any = {};

        // Extract values for each field at index i
        fieldMap.forEach((values, fieldName) => {
          source[fieldName] = values[i];
        });

        // Map timestamp fields - use 'time' if '@timestamp' is null
        const timestamp = source['@timestamp'] || source.time || source.observedTimestamp;
        source['@timestamp'] = timestamp;

        // Ensure we have the expected field names for compatibility
        source['severity.text'] = source.severityText;
        source['severity.number'] = source.severityNumber;

        hits.push({
          _index: 'logs',
          _id: `log_${i}`,
          _score: 1,
          _source: source,
        });
      }

      return hits;
    }

    // Handle datarows format (fallback)
    if (responseData?.datarows && Array.isArray(responseData.datarows)) {
      const schema = responseData.schema || [];
      const fieldNames = schema.map((field: any) => field.name);

      return responseData.datarows.map((row: any[], index: number) => {
        const source: any = {};
        fieldNames.forEach((fieldName: string, fieldIndex: number) => {
          source[fieldName] = row[fieldIndex];
        });

        const timestamp = source['@timestamp'] || source.time || source.observedTimestamp;
        source['@timestamp'] = timestamp;

        source['severity.text'] = source.severityText;
        source['severity.number'] = source.severityNumber;

        return {
          _index: 'logs',
          _id: `log_${index}`,
          _score: 1,
          _source: source,
        };
      });
    }

    // Fallback for standard response format
    if (responseData?.hits?.hits && Array.isArray(responseData.hits.hits)) {
      return responseData.hits.hits;
    }

    return [];
  } catch (error) {
    return [];
  }
};
