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

  return (
    span._source?.durationNano ||
    span._source?.durationInNanos ||
    span._source?.duration ||
    span._source?.['duration.nanos'] ||
    span.durationNano ||
    span.durationInNanos ||
    span.duration ||
    span['duration.nanos'] ||
    0
  );
};

export const extractHttpStatusCode = (span: any): number | undefined => {
  if (!span) return undefined;

  const source = span._source || span;

  return (
    source['attributes.http.status_code'] ||
    source.attributes?.['http.status_code'] ||
    source.attributes?.['http.response.status_code'] ||
    source.attributes?.http?.status_code ||
    source.attributes?.http?.response?.status_code ||
    source['http.status_code'] ||
    source.http?.status_code ||
    source.statusCode ||
    undefined
  );
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

/**
 * Format span attributes by filtering out overview fields and organizing them
 */
export const formatSpanAttributes = (span: any): Record<string, any> => {
  if (!span) return {};

  // Fields that are shown in the overview tab and should be excluded from attributes
  const overviewFields = new Set([
    'spanId',
    'parentSpanId',
    'serviceName',
    'name',
    'durationInNanos',
    'startTime',
    'endTime',
    'events',
    'traceId',
    'traceGroup',
    'traceGroupFields.endTime',
    'traceGroupFields.statusCode',
    'traceGroupFields.durationInNanos',
    'status.code',
    'status.message',
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

  const flattened = flattenObject(span);

  // Filter out overview fields and empty values
  const attributes: Record<string, any> = {};
  Object.keys(flattened)
    .filter((key) => !overviewFields.has(key))
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
