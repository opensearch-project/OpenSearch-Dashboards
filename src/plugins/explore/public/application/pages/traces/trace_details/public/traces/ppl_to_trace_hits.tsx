/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Interface for the flattened trace hit format
export interface TraceHit {
  traceId: string;
  droppedLinksCount: number;
  kind: string;
  droppedEventsCount: number;
  traceGroupFields: {
    endTime: string;
    durationInNanos: number;
    statusCode: number;
  };
  traceGroup: string;
  serviceName: string;
  parentSpanId: string;
  spanId: string;
  traceState: string;
  name: string;
  startTime: string;
  endTime: string;
  durationInNanos: number;
  'status.code': number;
  // Dynamic attributes will be added here
  [key: string]: any;
  // Sort field for ordering
  sort: number[];
}

// Interface for PPL response data structure
export interface PPLResponse {
  type?: string;
  body?: {
    name: string;
    schema?: Array<{
      name: string;
      type: string;
      values: any[];
    }>;
    fields: Array<{
      name: string;
      type: string;
      values: any[];
    }>;
    size: number;
    meta?: any;
  };
  // Direct structure (fallback)
  name?: string;
  schema?: Array<{
    name: string;
    type: string;
    values: any[];
  }>;
  fields?: Array<{
    name: string;
    type: string;
    values: any[];
  }>;
  size?: number;
  // Support for datarows format
  datarows?: any[][];
  total?: number;
}

export function transformPPLDataToTraceHits(pplResponse: PPLResponse): TraceHit[] {
  if (!pplResponse) {
    // eslint-disable-next-line no-console
    console.warn('PPL response is null or undefined');
    return [];
  }

  // Handle different response formats
  if (pplResponse.datarows && pplResponse.schema) {
    return transformDatarowsFormat(pplResponse);
  }

  // Handle nested structure with body property
  let responseData;
  if (pplResponse.type === 'data_frame' && pplResponse.body) {
    responseData = pplResponse.body;
  } else {
    responseData = pplResponse;
  }

  if (!responseData.fields || !responseData.size || responseData.size === 0) {
    // eslint-disable-next-line no-console
    console.warn('PPL response has no data:', {
      hasFields: !!responseData.fields,
      size: responseData.size,
    });
    return [];
  }

  return transformFieldsFormat(responseData);
}

/**
 * Transform datarows format PPL response
 */
function transformDatarowsFormat(pplResponse: PPLResponse): TraceHit[] {
  const { schema, datarows } = pplResponse;

  if (!schema || !datarows || !datarows.length) {
    // eslint-disable-next-line no-console
    console.warn('Invalid datarows format response');
    return [];
  }

  const traceHits: TraceHit[] = [];

  // Create a map of field names to their index positions
  const fieldIndexMap = new Map<string, number>();
  schema.forEach((field, index) => {
    fieldIndexMap.set(field.name, index);
  });

  // Process each row (span) in the response
  for (let i = 0; i < datarows.length; i++) {
    const row = datarows[i];

    try {
      const getValueByName = (name: string) => {
        const index = fieldIndexMap.get(name);
        return index !== undefined ? row[index] : undefined;
      };

      // Get original timestamps without formatting to preserve precision
      const originalStartTime = getValueByName('startTime') || '';
      const originalEndTime = getValueByName('endTime') || '';

      // Get nested objects
      const traceGroupFields = getValueByName('traceGroupFields') || {};
      const attributes = getValueByName('attributes') || {};
      const resource = getValueByName('resource') || {};
      const instrumentationScope = getValueByName('instrumentationScope') || {};

      const traceHit: TraceHit = {
        traceId: getValueByName('traceId') || '',
        droppedLinksCount: getValueByName('droppedLinksCount') || 0,
        kind: getValueByName('kind') || '',
        droppedEventsCount: getValueByName('droppedEventsCount') || 0,
        flags: getValueByName('flags') || 0,
        links: getValueByName('links') || [],
        events: getValueByName('events') || [],
        droppedAttributesCount: getValueByName('droppedAttributesCount') || 0,
        schemaUrl: getValueByName('schemaUrl') || '',

        // Preserve nested structures for filtering
        instrumentationScope,
        resource,

        traceGroupFields: {
          endTime: traceGroupFields.endTime || originalEndTime,
          durationInNanos:
            traceGroupFields.durationInNanos || getValueByName('durationInNanos') || 0,
          statusCode: traceGroupFields.statusCode || 0,
        },
        traceGroup: getValueByName('traceGroup') || '',
        serviceName: getValueByName('serviceName') || '',
        parentSpanId: getValueByName('parentSpanId') || '',
        spanId: getValueByName('spanId') || '',
        traceState: getValueByName('traceState') || '',
        name: getValueByName('name') || '',
        // Keep original high-precision timestamps as strings
        startTime: originalStartTime,
        endTime: originalEndTime,
        durationInNanos: getValueByName('durationInNanos') || 0,
        status: getValueByName('status') || { code: 0, message: '' },
        'status.code': extractStatusCode(getValueByName('status')) || 0,
        attributes,
        sort: [convertTimestampToNanos(originalStartTime)],
      };

      traceHits.push(traceHit);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error processing span at index ${i}:`, error);
      // Continue processing other spans even if one fails
    }
  }

  // Sort by start time (earliest first)
  traceHits.sort((a, b) => a.sort[0] - b.sort[0]);

  return traceHits;
}

/**
 * Transform fields format PPL response (original format)
 */
function transformFieldsFormat(responseData: any): TraceHit[] {
  const { fields, size, name } = responseData;
  const traceHits: TraceHit[] = [];

  // Create a map of field names to their values arrays for easy access
  const fieldMap = new Map<string, any[]>();
  fields.forEach((field: { name: string; values: any[] }) => {
    fieldMap.set(field.name, field.values);
  });

  // Process each row (span) in the response
  for (let i = 0; i < size; i++) {
    try {
      const traceGroupFields = fieldMap.get('traceGroupFields')?.[i] || {};
      const attributes = fieldMap.get('attributes')?.[i] || {};
      const resource = fieldMap.get('resource')?.[i] || {};
      const instrumentationScope = fieldMap.get('instrumentationScope')?.[i] || {};

      // Get original timestamps without formatting to preserve precision
      const originalStartTime = fieldMap.get('startTime')?.[i] || '';
      const originalEndTime = fieldMap.get('endTime')?.[i] || '';

      const traceHit: TraceHit = {
        traceId: fieldMap.get('traceId')?.[i] || '',
        droppedLinksCount: fieldMap.get('droppedLinksCount')?.[i] || 0,
        kind: fieldMap.get('kind')?.[i] || '',
        droppedEventsCount: fieldMap.get('droppedEventsCount')?.[i] || 0,
        flags: fieldMap.get('flags')?.[i] || 0,
        links: fieldMap.get('links')?.[i] || [],
        events: fieldMap.get('events')?.[i] || [],
        droppedAttributesCount: fieldMap.get('droppedAttributesCount')?.[i] || 0,
        schemaUrl: fieldMap.get('schemaUrl')?.[i] || '',

        // Preserve nested structures for filtering
        instrumentationScope,
        resource,

        traceGroupFields: {
          endTime: traceGroupFields.endTime || originalEndTime,
          durationInNanos:
            traceGroupFields.durationInNanos || fieldMap.get('durationInNanos')?.[i] || 0,
          statusCode: traceGroupFields.statusCode || 0,
        },
        traceGroup: fieldMap.get('traceGroup')?.[i] || '',
        serviceName: fieldMap.get('serviceName')?.[i] || '',
        parentSpanId: fieldMap.get('parentSpanId')?.[i] || '',
        spanId: fieldMap.get('spanId')?.[i] || '',
        traceState: fieldMap.get('traceState')?.[i] || '',
        name: fieldMap.get('name')?.[i] || '',
        // Keep original high-precision timestamps as strings
        startTime: originalStartTime,
        endTime: originalEndTime,
        durationInNanos: fieldMap.get('durationInNanos')?.[i] || 0,
        status: fieldMap.get('status')?.[i] || { code: 0, message: '' },
        'status.code': extractStatusCode(fieldMap.get('status')?.[i]) || 0,
        attributes,
        sort: [convertTimestampToNanos(originalStartTime)],
      };

      traceHits.push(traceHit);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error processing span at index ${i}:`, error);
      // Continue processing other spans even if one fails
    }
  }

  // Sort by start time (earliest first)
  traceHits.sort((a, b) => a.sort[0] - b.sort[0]);

  return traceHits;
}

/**
 * Converts timestamp to nanoseconds for sorting
 * @param timestamp - Timestamp in various formats
 * @returns Nanoseconds as number
 */
function convertTimestampToNanos(timestamp: any): number {
  if (!timestamp) return 0;

  try {
    let time: number;

    if (typeof timestamp === 'string') {
      // Handle high-precision timestamps like "2025-05-29 03:11:25.29217459"
      const date = new Date(timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z'));
      time = date.getTime();
      if (isNaN(time)) return 0;
    } else if (typeof timestamp === 'number') {
      time = new Date(timestamp).getTime();
      if (isNaN(time)) return 0;
    } else {
      time = new Date(timestamp).getTime();
      if (isNaN(time)) return 0;
    }

    return time * 1000000; // Convert milliseconds to nanoseconds
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error converting timestamp to nanos:', timestamp, error);
    return 0;
  }
}

/**
 * Extracts status code from status object
 * @param status - Status object from PPL response
 * @returns Status code number
 */
function extractStatusCode(status: any): number {
  if (!status) return 0;

  if (typeof status === 'object' && status.code !== undefined) {
    return status.code;
  }

  if (typeof status === 'number') {
    return status;
  }

  return 0;
}
