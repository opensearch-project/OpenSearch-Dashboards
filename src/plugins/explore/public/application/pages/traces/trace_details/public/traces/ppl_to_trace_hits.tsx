/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  resolveServiceName,
  resolveStartTime,
  resolveEndTime,
  resolveDuration,
  resolveInstrumentationScope,
  resolveServiceNameFromDatarows,
  resolveStartTimeFromDatarows,
  resolveEndTimeFromDatarows,
  resolveDurationFromDatarows,
  resolveInstrumentationScopeFromDatarows,
  convertTimestampToNanos,
  extractStatusCode,
} from './ppl_resolve_helpers';

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
  startTimeUnixNano?: string;
  endTimeUnixNano?: string;
  durationNano?: number;
  scope?: any;
  instrumentationScope?: any;
  // Dynamic attributes will be added here
  [key: string]: any;
  // Sort field for ordering
  sort: number[];
}

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

  for (let i = 0; i < datarows.length; i++) {
    const row = datarows[i];

    try {
      const getValueByName = (name: string) => {
        const index = fieldIndexMap.get(name);
        return index !== undefined ? row[index] : undefined;
      };

      const getFieldValueByName = (dataPrepperField: string, jaegerField?: string): any => {
        const dataPrepperValue = getValueByName(dataPrepperField);
        if (dataPrepperValue !== undefined && dataPrepperValue !== null) {
          return dataPrepperValue;
        }
        if (jaegerField) {
          return getValueByName(jaegerField);
        }
        return undefined;
      };

      const resolvedServiceName = resolveServiceNameFromDatarows(getValueByName);
      const resolvedStartTime = resolveStartTimeFromDatarows(getValueByName);
      const resolvedEndTime = resolveEndTimeFromDatarows(getValueByName);
      const resolvedDuration = resolveDurationFromDatarows(
        getValueByName,
        resolvedStartTime,
        resolvedEndTime
      );
      const resolvedInstrumentationScope = resolveInstrumentationScopeFromDatarows(getValueByName);

      // Get nested objects
      const traceGroupFields = getValueByName('traceGroupFields') || {};
      const attributes = getValueByName('attributes') || {};
      const resource = getValueByName('resource') || {};

      // Extract field values with schema-aware fallbacks
      const traceId = getFieldValueByName('traceId', 'traceID') || '';
      const spanId = getFieldValueByName('spanId', 'spanID') || '';

      // Extract parent span ID - Jaeger uses references array, DataPrepper uses parentSpanId
      const extractParentSpanId = (): string => {
        // First try DataPrepper format
        const directParent = getFieldValueByName('parentSpanId', 'parentSpanID');
        if (directParent) return directParent;

        // Then try Jaeger references format
        const references = getValueByName('references');
        if (Array.isArray(references) && references.length > 0) {
          const childOfRef = references.find((ref: any) => ref?.refType === 'CHILD_OF');
          if (childOfRef?.spanID) {
            return childOfRef.spanID;
          }
        }

        return '';
      };

      const parentSpanId = extractParentSpanId();
      const spanName = getFieldValueByName('name', 'operationName') || '';

      // Jaeger error mapping helpers
      const jaegerTags = getValueByName('tags') || [];
      const jaegerTag = getValueByName('tag') || {};
      const jaegerLogs = getValueByName('logs') || [];

      // Extract status code from Jaeger tags for error detection
      const extractJaegerStatusCode = (): number => {
        // Check explicit error markers first (highest priority)
        if (jaegerTag.error === 'true' || jaegerTag.error === true) {
          return 2; // ERROR
        }

        // Check for exception events (high priority error indicator)
        if (Array.isArray(jaegerLogs)) {
          const hasExceptionEvent = jaegerLogs.some((log: any) =>
            log?.fields?.some(
              (field: any) => field?.key === 'event' && field?.value === 'exception'
            )
          );
          if (hasExceptionEvent) {
            return 2; // ERROR
          }
        }

        // Check gRPC status code (for gRPC-over-HTTP calls)
        if (Array.isArray(jaegerTags)) {
          const grpcStatusTag = jaegerTags.find(
            (tag: any) => tag?.key === 'grpc.status_code' || tag?.key === 'rpc.grpc.status_code'
          );
          if (grpcStatusTag?.value) {
            const grpcCode = parseInt(grpcStatusTag.value, 10);
            // gRPC status codes: 0 = OK, >0 = Error
            // Important: gRPC errors can coexist with HTTP 200
            return grpcCode > 0 ? 2 : 1;
          }

          // Only check HTTP status code if no gRPC status is present
          const httpStatusTag = jaegerTags.find((tag: any) => tag?.key === 'http.status_code');
          if (httpStatusTag?.value) {
            const httpCode = parseInt(httpStatusTag.value, 10);
            // Map HTTP status codes to OpenTelemetry status codes
            // 2xx = OK -> 1 (OK), 4xx/5xx = Error -> 2 (ERROR)
            return httpCode >= 400 ? 2 : 1;
          }
        }

        return extractStatusCode(getValueByName('status')) || 0; // Default to UNSET for invalid status
      };

      const transformJaegerLogsToEvents = () => {
        const events = getValueByName('events') || [];

        if (Array.isArray(jaegerLogs)) {
          jaegerLogs.forEach((log: any) => {
            if (log?.fields && Array.isArray(log.fields)) {
              const eventAttributes: any = {};
              let eventName = 'log';

              log.fields.forEach((field: any) => {
                if (field?.key && field?.value !== undefined) {
                  if (field.key === 'event') {
                    eventName = field.value;
                  } else {
                    eventAttributes[field.key] = field.value;
                  }
                }
              });

              events.push({
                name: eventName,
                attributes: eventAttributes,
                time: log.timestamp ? new Date(log.timestamp / 1000000).toISOString() : undefined,
                droppedAttributesCount: 0,
              });
            }
          });
        }

        return events;
      };

      // Build enhanced attributes object including HTTP/gRPC status
      const enhancedAttributes = { ...attributes };

      if (Array.isArray(jaegerTags)) {
        jaegerTags.forEach((tag: any) => {
          if (tag?.key && tag?.value !== undefined) {
            // Add all tags to attributes for unified access
            enhancedAttributes[tag.key] = tag.value;
          }
        });
      }

      const finalStatusCode = extractJaegerStatusCode();
      const finalEvents = transformJaegerLogsToEvents();

      // Create unified field names for UI consistency
      const unifiedKind = getValueByName('kind') || jaegerTag['span@kind'] || jaegerTag.kind || '';

      // Create unified HTTP status code field (HTTP only, no gRPC fallback)
      const unifiedHttpStatusCode = enhancedAttributes['http.status_code'];

      // Create unified gRPC status code field (separate from HTTP)
      const unifiedGrpcStatusCode = enhancedAttributes['rpc.grpc.status_code'];

      const traceHit: TraceHit = {
        traceId,
        droppedLinksCount: getValueByName('droppedLinksCount') || 0,
        kind: unifiedKind,
        droppedEventsCount: getValueByName('droppedEventsCount') || 0,
        flags: getValueByName('flags') || 0,
        links: getValueByName('links') || [],
        events: finalEvents,
        droppedAttributesCount: getValueByName('droppedAttributesCount') || 0,
        schemaUrl: getValueByName('schemaUrl') || '',

        // Preserve nested structures for filtering
        instrumentationScope: resolvedInstrumentationScope,
        resource,

        // Preserve Jaeger-specific fields for error detection
        tags: jaegerTags,
        tag: jaegerTag,
        logs: jaegerLogs,

        traceGroupFields: {
          endTime: traceGroupFields.endTime || resolvedEndTime,
          durationInNanos: traceGroupFields.durationInNanos || resolvedDuration,
          statusCode: traceGroupFields.statusCode || finalStatusCode,
        },
        traceGroup: getValueByName('traceGroup') || '',
        serviceName: resolvedServiceName,
        parentSpanId,
        spanId,
        traceState: getValueByName('traceState') || '',
        name: spanName,

        // Keep resolved high-precision timestamps as strings
        startTime: resolvedStartTime,
        endTime: resolvedEndTime,
        durationInNanos: resolvedDuration,

        startTimeUnixNano: getValueByName('startTimeUnixNano'),
        endTimeUnixNano: getValueByName('endTimeUnixNano'),
        durationNano: getValueByName('durationNano'),
        scope: getValueByName('scope'),

        status: getValueByName('status') || {
          code: finalStatusCode,
          message: finalStatusCode === 2 ? 'Error detected' : '',
        },
        'status.code': finalStatusCode,
        attributes: enhancedAttributes,

        // These ensure the same columns appear for both DataPrepper and Jaeger
        'attributes.http.status_code': unifiedHttpStatusCode,
        'attributes.rpc.grpc.status_code': unifiedGrpcStatusCode,
        'resource.attributes.service.name': resolvedServiceName,
        'tag.span@kind': jaegerTag['span@kind'] || jaegerTag.kind,
        'rpc.grpc.status_code': enhancedAttributes['rpc.grpc.status_code'],
        operationName: spanName,
        duration: getValueByName('duration'),
        spanID: spanId,
        'process.serviceName': resolvedServiceName,

        sort: [
          (() => {
            try {
              return convertTimestampToNanos(resolvedStartTime) || 0;
            } catch (error) {
              return 0;
            }
          })(),
        ],
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

function transformFieldsFormat(responseData: any): TraceHit[] {
  const { fields, size } = responseData;
  const traceHits: TraceHit[] = [];

  // Create a map of field names to their values arrays for easy access
  const fieldMap = new Map<string, any[]>();
  fields.forEach((field: { name: string; values: any[] }) => {
    fieldMap.set(field.name, field.values);
  });

  const getFieldValue = (dataPrepperField: string, index: number, jaegerField?: string): any => {
    const dataPrepperValue = fieldMap.get(dataPrepperField)?.[index];
    if (dataPrepperValue !== undefined && dataPrepperValue !== null) {
      return dataPrepperValue;
    }
    if (jaegerField) {
      return fieldMap.get(jaegerField)?.[index];
    }
    return undefined;
  };

  // Process each row (span) in the response
  for (let i = 0; i < size; i++) {
    try {
      const resolvedServiceName = resolveServiceName(fieldMap, i);
      const resolvedStartTime = resolveStartTime(fieldMap, i);
      const resolvedEndTime = resolveEndTime(fieldMap, i);
      const resolvedDuration = resolveDuration(fieldMap, i, resolvedStartTime, resolvedEndTime);
      const resolvedInstrumentationScope = resolveInstrumentationScope(fieldMap, i);

      const traceGroupFields = fieldMap.get('traceGroupFields')?.[i] || {};
      const attributes = fieldMap.get('attributes')?.[i] || {};
      const resource = fieldMap.get('resource')?.[i] || {};

      // Extract field values with schema-aware fallbacks
      const traceId = getFieldValue('traceId', i, 'traceID') || '';
      const spanId = getFieldValue('spanId', i, 'spanID') || '';

      // Extract parent span ID - Jaeger uses references array, DataPrepper uses parentSpanId
      const extractParentSpanId = (): string => {
        // First try DataPrepper format
        const directParent = getFieldValue('parentSpanId', i, 'parentSpanID');
        if (directParent) return directParent;

        // Then try Jaeger references format
        const references = fieldMap.get('references')?.[i];
        if (Array.isArray(references) && references.length > 0) {
          const childOfRef = references.find((ref: any) => ref?.refType === 'CHILD_OF');
          if (childOfRef?.spanID) {
            return childOfRef.spanID;
          }
        }

        return '';
      };

      const parentSpanId = extractParentSpanId();
      const spanName = getFieldValue('name', i, 'operationName') || '';

      // Jaeger error mapping helpers for fields format
      const jaegerTags = fieldMap.get('tags')?.[i] || [];
      const jaegerTag = fieldMap.get('tag')?.[i] || {};
      const jaegerLogs = fieldMap.get('logs')?.[i] || [];

      // Extract status code from Jaeger tags for error detection (fields format)
      const extractJaegerStatusCode = (): number => {
        // Check explicit error markers first (highest priority)
        if (jaegerTag.error === 'true' || jaegerTag.error === true) {
          return 2; // ERROR
        }

        // Check for exception events (high priority error indicator)
        if (Array.isArray(jaegerLogs)) {
          const hasExceptionEvent = jaegerLogs.some((log: any) =>
            log?.fields?.some(
              (field: any) => field?.key === 'event' && field?.value === 'exception'
            )
          );
          if (hasExceptionEvent) {
            return 2; // ERROR
          }
        }

        // Check gRPC status code (for gRPC-over-HTTP calls)
        if (Array.isArray(jaegerTags)) {
          const grpcStatusTag = jaegerTags.find(
            (tag: any) => tag?.key === 'grpc.status_code' || tag?.key === 'rpc.grpc.status_code'
          );
          if (grpcStatusTag?.value) {
            const grpcCode = parseInt(grpcStatusTag.value, 10);
            // gRPC status codes: 0 = OK, >0 = Error
            // Important: gRPC errors can coexist with HTTP 200
            return grpcCode > 0 ? 2 : 1;
          }

          // Only check HTTP status code if no gRPC status is present
          const httpStatusTag = jaegerTags.find((tag: any) => tag?.key === 'http.status_code');
          if (httpStatusTag?.value) {
            const httpCode = parseInt(httpStatusTag.value, 10);
            // Map HTTP status codes to OpenTelemetry status codes
            // 2xx = OK -> 1 (OK), 4xx/5xx = Error -> 2 (ERROR)
            return httpCode >= 400 ? 2 : 1;
          }
        }

        return extractStatusCode(fieldMap.get('status')?.[i]) || 0; // Default to UNSET for invalid status
      };

      // Transform Jaeger logs to events for compatibility
      const transformJaegerLogsToEvents = () => {
        const events = fieldMap.get('events')?.[i] || [];

        if (Array.isArray(jaegerLogs)) {
          jaegerLogs.forEach((log: any) => {
            if (log?.fields && Array.isArray(log.fields)) {
              // Convert Jaeger log format to event format
              const eventAttributes: any = {};
              let eventName = 'log';

              log.fields.forEach((field: any) => {
                if (field?.key && field?.value !== undefined) {
                  if (field.key === 'event') {
                    eventName = field.value;
                  } else {
                    eventAttributes[field.key] = field.value;
                  }
                }
              });

              events.push({
                name: eventName,
                attributes: eventAttributes,
                time: log.timestamp ? new Date(log.timestamp / 1000000).toISOString() : undefined,
                droppedAttributesCount: 0,
              });
            }
          });
        }

        return events;
      };

      // Build enhanced attributes object including HTTP/gRPC status
      const enhancedAttributes = { ...attributes };

      if (Array.isArray(jaegerTags)) {
        jaegerTags.forEach((tag: any) => {
          if (tag?.key && tag?.value !== undefined) {
            // Add all tags to attributes for unified access
            enhancedAttributes[tag.key] = tag.value;
          }
        });
      }

      const finalStatusCode = extractJaegerStatusCode();
      const finalEvents = transformJaegerLogsToEvents();

      // Create unified field names for UI consistency (fields format)
      const unifiedKind =
        fieldMap.get('kind')?.[i] || jaegerTag['span@kind'] || jaegerTag.kind || '';

      // Create unified HTTP status code field (HTTP only, no gRPC fallback)
      const unifiedHttpStatusCode = enhancedAttributes['http.status_code'];

      // Create unified gRPC status code field (separate from HTTP)
      const unifiedGrpcStatusCode = enhancedAttributes['rpc.grpc.status_code'];

      const traceHit: TraceHit = {
        traceId,
        droppedLinksCount: fieldMap.get('droppedLinksCount')?.[i] || 0,
        kind: unifiedKind,
        droppedEventsCount: fieldMap.get('droppedEventsCount')?.[i] || 0,
        flags: fieldMap.get('flags')?.[i] || 0,
        links: fieldMap.get('links')?.[i] || [],
        events: finalEvents,
        droppedAttributesCount: fieldMap.get('droppedAttributesCount')?.[i] || 0,
        schemaUrl: fieldMap.get('schemaUrl')?.[i] || '',

        // Preserve nested structures for filtering
        instrumentationScope: resolvedInstrumentationScope,
        resource,

        // Preserve Jaeger-specific fields for error detection
        tags: jaegerTags,
        tag: jaegerTag,
        logs: jaegerLogs,

        traceGroupFields: {
          endTime: traceGroupFields.endTime || resolvedEndTime,
          durationInNanos: traceGroupFields.durationInNanos || resolvedDuration,
          statusCode: traceGroupFields.statusCode || finalStatusCode,
        },
        traceGroup: fieldMap.get('traceGroup')?.[i] || '',
        serviceName: resolvedServiceName,
        parentSpanId,
        spanId,
        traceState: fieldMap.get('traceState')?.[i] || '',
        name: spanName,

        // Keep resolved high-precision timestamps as strings
        startTime: resolvedStartTime,
        endTime: resolvedEndTime,
        durationInNanos: resolvedDuration,

        // Add new fields if available
        startTimeUnixNano: fieldMap.get('startTimeUnixNano')?.[i],
        endTimeUnixNano: fieldMap.get('endTimeUnixNano')?.[i],
        durationNano: fieldMap.get('durationNano')?.[i],
        scope: fieldMap.get('scope')?.[i],

        status: fieldMap.get('status')?.[i] || {
          code: finalStatusCode,
          message: finalStatusCode === 2 ? 'Error detected from Jaeger indicators' : '',
        },
        'status.code': finalStatusCode,
        attributes: enhancedAttributes,

        // UNIFIED FIELD NAMES FOR UI CONSISTENCY (fields format)
        // These ensure the same columns appear for both DataPrepper and Jaeger
        'attributes.http.status_code': unifiedHttpStatusCode,
        'attributes.rpc.grpc.status_code': unifiedGrpcStatusCode,
        'resource.attributes.service.name': resolvedServiceName,
        'tag.span@kind': jaegerTag['span@kind'] || jaegerTag.kind,
        'rpc.grpc.status_code': enhancedAttributes['rpc.grpc.status_code'],
        operationName: spanName,
        duration: fieldMap.get('duration')?.[i],
        spanID: spanId,
        'process.serviceName': resolvedServiceName,

        sort: [
          (() => {
            try {
              return convertTimestampToNanos(resolvedStartTime) || 0;
            } catch (error) {
              return 0;
            }
          })(),
        ],
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
