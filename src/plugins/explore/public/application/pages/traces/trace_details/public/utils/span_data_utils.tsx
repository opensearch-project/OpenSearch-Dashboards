/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from './helper_functions';
import { isSpanError } from '../traces/ppl_resolve_helpers';

export interface SpanIssue {
  type: 'error' | 'event';
  message: string;
  timestamp?: string;
  details?: any;
}

export interface SpanOverviewData {
  spanId: string;
  parentSpanId?: string;
  serviceName: string;
  operationName: string;
  duration: number;
  startTime: string;
  endTime: string;
  hasError: boolean;
  statusCode?: number;
}

/**
 * Extract issues (errors and relevant events) from a span
 */
export const extractSpanIssues = (span: any): SpanIssue[] => {
  if (!span) return [];

  const issues: SpanIssue[] = [];

  // Check for error status
  if (isSpanError(span)) {
    issues.push({
      type: 'error',
      message: 'Span has error status',
      details: {
        statusCode: span['status.code'] || span.status?.code,
        statusMessage: span['status.message'] || span.status?.message,
      },
    });
  }

  // Check events for error-related information
  if (span.events && Array.isArray(span.events)) {
    span.events.forEach((event: any) => {
      // Look for error-related events
      if (
        event.name?.toLowerCase().includes('error') ||
        event.name?.toLowerCase().includes('exception') ||
        event.name?.toLowerCase().includes('fault')
      ) {
        // Capitalize "Exception" and "Error" in the message
        let message = event.name || 'Error event';
        if (message.toLowerCase().includes('exception')) {
          message = message.replace(/exception/gi, 'Exception');
        }
        if (message.toLowerCase().includes('error')) {
          message = message.replace(/error/gi, 'Error');
        }

        issues.push({
          type: 'event',
          message,
          timestamp: event.timeUnixNano || event.timestamp,
          details: event,
        });
      }
    });
  }

  return issues;
};

/**
 * Get the count of issues in a span
 */
export const getSpanIssueCount = (span: any): number => {
  return extractSpanIssues(span).length;
};

export const extractSpanDuration = (span: any): number => {
  if (!span) return 0;

  // DataPrepper format - try nanosecond fields first (highest precision)
  const nanosDuration =
    span._source?.durationNano ||
    span._source?.durationInNanos ||
    span._source?.['duration.nanos'] ||
    span.durationNano ||
    span.durationInNanos ||
    span['duration.nanos'];

  if (nanosDuration !== undefined && nanosDuration !== null) {
    return nanosDuration;
  }

  // Jaeger format - microsecond duration field
  const jaegerDuration = span._source?.duration || span.duration;
  if (jaegerDuration !== undefined && jaegerDuration !== null) {
    // Only convert if this looks like a raw Jaeger span
    const isRawJaeger = !span.durationInNanos && !span._source?.durationInNanos;

    if (isRawJaeger) {
      // Convert Jaeger microseconds to nanoseconds
      return jaegerDuration * 1000;
    } else {
      if (jaegerDuration > 1000000000) {
        return jaegerDuration; // Already nanoseconds
      } else {
        return jaegerDuration * 1000; // Convert microseconds to nanoseconds
      }
    }
  }

  return 0;
};

export const extractStartTime = (span: any): string | number | undefined => {
  if (!span) return undefined;

  const source = span._source || span;

  // Handle the case where startTime is resolved from PPL transformation
  if (span.startTime !== undefined && span.startTime !== null && span.startTime !== '') {
    const startTimeValue = span.startTime;

    // If it's a string representing nanoseconds (19 digits), convert to milliseconds
    if (typeof startTimeValue === 'string' && /^\d{19}$/.test(startTimeValue)) {
      const nanoseconds = parseInt(startTimeValue, 10);
      return Math.floor(nanoseconds / 1000000);
    }

    // If it's a number in nanoseconds (very large), convert to milliseconds
    if (typeof startTimeValue === 'number' && startTimeValue > 1e15) {
      return Math.floor(startTimeValue / 1000000);
    }

    return span.startTime;
  }

  // DataPrepper format (ISO string or epoch)
  if (source.startTime !== undefined && source.startTime !== null && source.startTime !== '') {
    return source.startTime;
  }

  // Jaeger format - startTimeMillis is in milliseconds (epoch)
  if (source.startTimeMillis !== undefined && source.startTimeMillis !== null) {
    return source.startTimeMillis;
  }

  // Jaeger format - startTime is in microseconds, convert to milliseconds
  if (source.startTime && typeof source.startTime === 'number') {
    // If it's a large number (microseconds), convert to milliseconds
    if (source.startTime > 1000000000000) {
      return Math.floor(source.startTime / 1000);
    }
    return source.startTime;
  }

  // Check if startTimeUnixNano exists and convert to milliseconds
  if (source.startTimeUnixNano) {
    const nanoTime = parseInt(source.startTimeUnixNano, 10);
    if (!isNaN(nanoTime)) {
      return Math.floor(nanoTime / 1000000); // nanoseconds to milliseconds
    }
  }

  if (source['@timestamp']) {
    return source['@timestamp'];
  }

  if (source.timestamp) {
    return source.timestamp;
  }

  if (span.traceGroupFields?.endTime && span.durationInNanos) {
    try {
      const endTime = new Date(span.traceGroupFields.endTime).getTime();
      const durationMs = Math.floor(span.durationInNanos / 1000000);
      const startTime = endTime - durationMs;
      if (!isNaN(startTime) && startTime > 0) {
        return startTime;
      }
    } catch (error) {}
  }

  return undefined;
};

export const extractHttpStatusCode = (span: any): number | undefined => {
  if (!span) return undefined;

  const source = span._source || span;

  // Check for actual HTTP context first
  if (hasHttpContext(span)) {
    return (
      source['attributes.http.status_code'] ||
      source.attributes?.['http.status_code'] ||
      source.attributes?.['http.response.status_code'] ||
      source.attributes?.http?.status_code ||
      source.attributes?.http?.response?.status_code ||
      source['http.status_code'] ||
      source.http?.status_code ||
      undefined
    );
  }

  return undefined;
};

export const hasHttpContext = (span: any): boolean => {
  if (!span) return false;

  const source = span._source || span;

  const hasHttpFields = !!(
    source.attributes?.['http.method'] ||
    source.attributes?.['http.url'] ||
    source.attributes?.['http.request.method'] ||
    source.attributes?.['url.full'] ||
    source.attributes?.http?.method ||
    source.attributes?.http?.url ||
    source['http.method'] ||
    source['http.url']
  );

  const isRpcSpan = !!(
    source.attributes?.['rpc.system'] ||
    source.attributes?.['rpc.service'] ||
    source.attributes?.['rpc.method'] ||
    source.attributes?.['grpc.method'] ||
    source.attributes?.['grpc.status_code'] ||
    source.attributes?.rpc?.system ||
    source.attributes?.rpc?.service ||
    source['rpc.system'] ||
    source['rpc.service'] ||
    source['grpc.method'] ||
    source['grpc.status_code']
  );

  if (Array.isArray(span.tags)) {
    const hasRpcTags = span.tags.some(
      (tag: any) =>
        tag?.key === 'rpc.system' ||
        tag?.key === 'rpc.service' ||
        tag?.key === 'rpc.method' ||
        tag?.key === 'grpc.method' ||
        tag?.key === 'grpc.status_code' ||
        tag?.key === 'rpc.grpc.status_code'
    );
    if (hasRpcTags) return false;
  }

  // For gRPC-over-HTTP spans, prioritize showing gRPC status over HTTP status
  // Hide HTTP context when there's a gRPC error to avoid confusing users with HTTP 200
  if (isRpcSpan) {
    return false;
  }

  return hasHttpFields;
};

export const hasRpcContext = (span: any): boolean => {
  if (!span) return false;

  const source = span._source || span;

  const hasRpcFields = !!(
    source.attributes?.['rpc.system'] ||
    source.attributes?.['rpc.service'] ||
    source.attributes?.['rpc.method'] ||
    source.attributes?.['grpc.method'] ||
    source.attributes?.['grpc.status_code'] ||
    source.attributes?.rpc?.system ||
    source.attributes?.rpc?.service ||
    source['rpc.system'] ||
    source['rpc.service'] ||
    source['grpc.method'] ||
    source['grpc.status_code']
  );

  if (Array.isArray(span.tags)) {
    const hasRpcTags = span.tags.some(
      (tag: any) =>
        tag?.key === 'rpc.system' ||
        tag?.key === 'rpc.service' ||
        tag?.key === 'rpc.method' ||
        tag?.key === 'grpc.method' ||
        tag?.key === 'grpc.status_code' ||
        tag?.key === 'rpc.grpc.status_code'
    );
    if (hasRpcTags) return true;
  }

  return hasRpcFields;
};

export const extractRpcData = (span: any) => {
  if (!span || !hasRpcContext(span)) return null;

  const source = span._source || span;

  let rpcSystem;
  let rpcService;
  let rpcMethod;
  let rpcStatusCode;

  // Extract from attributes
  rpcSystem =
    source.attributes?.['rpc.system'] || source.attributes?.rpc?.system || source['rpc.system'];
  rpcService =
    source.attributes?.['rpc.service'] || source.attributes?.rpc?.service || source['rpc.service'];
  rpcMethod =
    source.attributes?.['rpc.method'] ||
    source.attributes?.rpc?.method ||
    source['rpc.method'] ||
    source.attributes?.['grpc.method'] ||
    source['grpc.method'];
  rpcStatusCode =
    source.attributes?.['rpc.grpc.status_code'] ||
    source.attributes?.rpc?.grpc?.status_code ||
    source['rpc.grpc.status_code'] ||
    source.attributes?.['grpc.status_code'] ||
    source['grpc.status_code'];

  // Also check Jaeger tags
  if (Array.isArray(span.tags)) {
    span.tags.forEach((tag: any) => {
      if (tag?.key === 'rpc.system') rpcSystem = tag.value;
      if (tag?.key === 'rpc.service') rpcService = tag.value;
      if (tag?.key === 'rpc.method') rpcMethod = tag.value;
      if (tag?.key === 'grpc.method') rpcMethod = tag.value;
      if (tag?.key === 'rpc.grpc.status_code') rpcStatusCode = tag.value;
      if (tag?.key === 'grpc.status_code') rpcStatusCode = tag.value;
    });
  }

  return {
    system: rpcSystem || 'grpc',
    service: rpcService,
    method: rpcMethod,
    statusCode: rpcStatusCode ? parseInt(rpcStatusCode, 10) : undefined,
  };
};

/**
 * Extract overview data from a span
 */
export const getSpanOverviewData = (span: any): SpanOverviewData | null => {
  if (!span) return null;

  return {
    spanId: span.spanId || '',
    parentSpanId: span.parentSpanId,
    serviceName: span.serviceName || '',
    operationName: span.name || '',
    duration: extractSpanDuration(span),
    startTime: span.startTime || '',
    endTime: span.endTime || '',
    hasError: isSpanError(span),
    statusCode: span['status.code'] || span.status?.code,
  };
};

const isJaegerSpan = (span: any): boolean => {
  return !!(
    span?.process?.serviceName ||
    span?.operationName ||
    (Array.isArray(span?.tags) &&
      span.tags.some((tag: any) => tag?.key && tag?.value !== undefined)) ||
    (Array.isArray(span?.process?.tags) &&
      span.process.tags.some((tag: any) => tag?.key && tag?.value !== undefined))
  );
};

const transformJaegerSpan = (span: any): any => {
  const transformed: any = { ...span };

  if (span.process) {
    transformed.resource = {
      attributes: {
        service: {
          name: span.process.serviceName,
        },
      },
    };

    // Transform process tags to resource attributes
    if (Array.isArray(span.process.tags)) {
      span.process.tags.forEach((tag: any) => {
        if (tag?.key && tag?.value !== undefined) {
          if (tag.key.includes('telemetry.sdk')) {
            if (!transformed.resource.attributes.telemetry) {
              transformed.resource.attributes.telemetry = { sdk: {} };
            }
            const sdkKey = tag.key.replace('telemetry.sdk.', '');
            transformed.resource.attributes.telemetry.sdk[sdkKey] = tag.value;
          } else if (tag.key.includes('service.')) {
            const serviceKey = tag.key.replace('service.', '');
            transformed.resource.attributes.service[serviceKey] = tag.value;
          } else if (tag.key.includes('host.')) {
            if (!transformed.resource.attributes.host) {
              transformed.resource.attributes.host = {};
            }
            const hostKey = tag.key.replace('host.', '');
            transformed.resource.attributes.host[hostKey] = tag.value;
          } else if (tag.key.includes('os.')) {
            if (!transformed.resource.attributes.os) {
              transformed.resource.attributes.os = {};
            }
            const osKey = tag.key.replace('os.', '');
            transformed.resource.attributes.os[osKey] = tag.value;
          } else {
            // General resource attribute
            transformed.resource.attributes[tag.key] = tag.value;
          }
        }
      });
    }
  }

  if (span.tags && Array.isArray(span.tags)) {
    const scopeTag = span.tags.find((tag: any) => tag?.key === 'otel.scope.name');
    const scopeVersionTag = span.tags.find((tag: any) => tag?.key === 'otel.scope.version');

    if (scopeTag) {
      transformed.instrumentationScope = {
        name: scopeTag.value,
        droppedAttributesCount: 0,
      };

      if (scopeVersionTag) {
        transformed.instrumentationScope.version = scopeVersionTag.value;
      }
    }
  }

  if (Array.isArray(span.tags)) {
    transformed.attributes = {};

    span.tags.forEach((tag: any) => {
      if (tag?.key && tag?.value !== undefined) {
        if (tag.key.startsWith('otel.scope.')) return;

        if (tag.key.includes('http.')) {
          if (!transformed.attributes.http) {
            transformed.attributes.http = {};
          }
          const httpKey = tag.key.replace('http.', '');
          transformed.attributes.http[httpKey] = tag.value;
        } else if (tag.key.includes('rpc.')) {
          if (!transformed.attributes.rpc) {
            transformed.attributes.rpc = {};
          }
          const rpcKey = tag.key.replace('rpc.', '');
          transformed.attributes.rpc[rpcKey] = tag.value;
        } else if (tag.key.includes('peer.')) {
          if (!transformed.attributes.peer) {
            transformed.attributes.peer = {};
          }
          const peerKey = tag.key.replace('peer.', '');
          transformed.attributes.peer[peerKey] = tag.value;
        } else {
          transformed.attributes[tag.key] = tag.value;
        }
      }
    });
  }

  if (span.tag && typeof span.tag === 'object' && !Array.isArray(span.tag)) {
    if (!transformed.attributes) {
      transformed.attributes = {};
    }

    Object.entries(span.tag).forEach(([key, value]) => {
      transformed.attributes[key] = value;
    });
  }

  if (span.operationName && !transformed.name) {
    transformed.name = span.operationName;
  }

  return transformed;
};

/**
 * Format span attributes by filtering out overview fields and organizing them
 */
export const formatSpanAttributes = (span: any): Record<string, any> => {
  if (!span) return {};

  const workingSpan = isJaegerSpan(span) ? transformJaegerSpan(span) : span;

  // Fields that are shown in the overview tab and should be excluded from attributes
  const overviewFields = new Set([
    'spanId',
    'spanID',
    'parentSpanId',
    'parentSpanID',
    'serviceName',
    'name',
    'operationName',
    'durationInNanos',
    'duration',
    'startTime',
    'startTimeMillis',
    'endTime',
    'events',
    'logs',
    'traceId',
    'traceID',
    'traceGroup',
    'traceGroupFields.endTime',
    'traceGroupFields.statusCode',
    'traceGroupFields.durationInNanos',
    'status.code',
    'status.message',
    'flags',
    'references',
    // Exclude raw Jaeger fields that have been transformed to organized structure
    'tags', // Raw Jaeger tags array - transformed to attributes.*
    'process', // Raw Jaeger process object - transformed to resource.*
    'tag', // Raw Jaeger tag object - transformed to attributes.*
  ]);

  // Flatten the span object
  const flattenObject = (
    obj: any,
    prefix = '',
    result: Record<string, any> = {}
  ): Record<string, any> => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          flattenObject(obj[key], newKey, result);
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    return result;
  };

  const flattened = flattenObject(workingSpan);

  // Filter out overview fields and empty values
  const attributes: Record<string, any> = {};
  Object.keys(flattened)
    .filter((key) => {
      // Don't exclude tags if it's a simple array (not Jaeger tag structure)
      if (key === 'tags' && Array.isArray(workingSpan.tags)) {
        // Check if it's a Jaeger tags array (array of objects with key/value)
        const isJaegerTags =
          workingSpan.tags.length > 0 &&
          workingSpan.tags.every((tag: any) => tag && typeof tag === 'object' && 'key' in tag);
        return !isJaegerTags;
      }
      return !overviewFields.has(key);
    })
    .forEach((key) => {
      const value = flattened[key];
      if (!isEmpty(value)) {
        attributes[key] = value;
      }
    });

  return attributes;
};

/**
 * Get the count of attributes in a span
 */
export const getSpanAttributeCount = (span: any): number => {
  return Object.keys(formatSpanAttributes(span)).length;
};

/**
 * Check if a span has any events
 */
export const hasSpanEvents = (span: any): boolean => {
  return !!(span?.events && Array.isArray(span.events) && span.events.length > 0);
};

/**
 * Helper function to check if a value is empty
 */
const _isEmpty = (value: any): boolean => {
  return (
    value == null ||
    (value.hasOwnProperty('length') && value.length === 0) ||
    (value.constructor === Object && Object.keys(value).length === 0)
  );
};

/**
 * Sort attributes by putting non-empty values first
 */
export const sortAttributes = (attributes: Record<string, any>): Array<[string, any]> => {
  return Object.entries(attributes).sort(([keyA, valueA], [keyB, valueB]) => {
    const isAEmpty = _isEmpty(valueA);
    const isBEmpty = _isEmpty(valueB);

    if ((isAEmpty && isBEmpty) || (!isAEmpty && !isBEmpty)) {
      return keyA < keyB ? -1 : 1;
    }
    if (isAEmpty) return 1;
    return -1;
  });
};
