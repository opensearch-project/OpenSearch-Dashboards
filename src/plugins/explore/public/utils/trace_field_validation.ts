/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSearchHit } from '../types/doc_views_types';
import {
  SPAN_ID_FIELD_PATHS,
  TRACE_ID_FIELD_PATHS,
  SPAN_NAME_FIELD_PATHS,
  STATUS_CODE_FIELD_PATHS,
} from './trace_field_constants';

export const START_TIME_FIELD_PATHS = [
  'startTime',
  'startTimeMillis',
  'startTimeUnixNano',
  '_source.startTime',
  '_source.startTimeMillis',
  '_source.startTimeUnixNano',
  'fields.startTime',
  'fields.startTimeMillis',
  'fields.startTimeUnixNano',
] as const;

export const END_TIME_FIELD_PATHS = [
  'endTime',
  'endTimeMillis',
  'endTimeUnixNano',
  '_source.endTime',
  '_source.endTimeMillis',
  '_source.endTimeUnixNano',
  'fields.endTime',
  'fields.endTimeMillis',
  'fields.endTimeUnixNano',
] as const;

export const PARENT_SPAN_ID_FIELD_PATHS = [
  'parentSpanId',
  'parent_span_id',
  'parentSpanID',
  'parent_span_ID',
  '_source.parentSpanId',
  '_source.parent_span_id',
  'fields.parentSpanId',
  'fields.parent_span_id',
] as const;

const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce((current: unknown, key: string) => {
    return current && typeof current === 'object' && current !== null
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj);
};

export const extractFieldFromRowData = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>,
  fields: readonly string[]
): string => {
  if (!rowData) return '';

  for (const field of fields) {
    const value = getNestedValue(rowData, field);
    if (
      value !== undefined &&
      value !== null &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return String(value);
    }
  }
  return '';
};

export const extractServiceNameFromRowData = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>
): string => {
  if (!rowData) return '';

  const processServiceName = getNestedValue(rowData, 'process.serviceName');
  if (processServiceName && typeof processServiceName === 'string') {
    return processServiceName;
  }

  const sourceProcessServiceName = getNestedValue(rowData, '_source.process.serviceName');
  if (sourceProcessServiceName && typeof sourceProcessServiceName === 'string') {
    return sourceProcessServiceName;
  }

  const resourceServiceName = getNestedValue(rowData, 'resource.attributes.service.name');
  if (resourceServiceName && typeof resourceServiceName === 'string') {
    return resourceServiceName;
  }

  const resourceServiceNameAlt = getNestedValue(rowData, 'resource.attributes.service.name');
  if (resourceServiceNameAlt && typeof resourceServiceNameAlt === 'string') {
    return resourceServiceNameAlt;
  }

  const sourceServiceName = getNestedValue(rowData, '_source.serviceName');
  if (sourceServiceName && typeof sourceServiceName === 'string') {
    return sourceServiceName;
  }

  const serviceName = getNestedValue(rowData, 'serviceName');
  if (serviceName && typeof serviceName === 'string') {
    return serviceName;
  }

  const sourceName = getNestedValue(rowData, '_source.name');
  if (sourceName && typeof sourceName === 'string') {
    return sourceName;
  }

  const name = getNestedValue(rowData, 'name');
  if (name && typeof name === 'string') {
    return name;
  }

  return '';
};

export const extractJaegerTagValue = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>,
  tagKey: string
): string => {
  if (!rowData) return '';

  const tags = getNestedValue(rowData, 'tags') || getNestedValue(rowData, '_source.tags');
  if (Array.isArray(tags)) {
    const tag = tags.find((t: any) => t?.key === tagKey);
    if (tag?.value && typeof tag.value === 'string') {
      return tag.value;
    }
  }

  const processTags =
    getNestedValue(rowData, 'process.tags') || getNestedValue(rowData, '_source.process.tags');
  if (Array.isArray(processTags)) {
    const tag = processTags.find((t: any) => t?.key === tagKey);
    if (tag?.value && typeof tag.value === 'string') {
      return tag.value;
    }
  }

  return '';
};

export const extractJaegerHttpStatusCode = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>
): string => {
  if (!rowData) return '';

  // Try extracting from Jaeger tags first
  const httpStatusFromTags = extractJaegerTagValue(rowData, 'http.status_code');
  if (httpStatusFromTags) {
    return httpStatusFromTags;
  }

  // Fallback to standard HTTP status code extraction
  const httpStatusFromFields = extractFieldFromRowData(rowData, [
    'attributes.http.status_code',
    'http.status_code',
    'httpStatusCode',
    '_source.attributes.http.status_code',
    '_source.http.status_code',
  ]);

  return httpStatusFromFields;
};

export const extractJaegerGrpcStatusCode = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>
): string => {
  if (!rowData) return '';

  // Try extracting from Jaeger tags first - check both field formats
  const grpcStatusFromTags =
    extractJaegerTagValue(rowData, 'rpc.grpc.status_code') ||
    extractJaegerTagValue(rowData, 'grpc.status_code');
  if (grpcStatusFromTags) {
    return grpcStatusFromTags;
  }

  // Fallback to standard gRPC status code extraction - include both field formats
  const grpcStatusFromFields = extractFieldFromRowData(rowData, [
    'attributes.rpc.grpc.status_code',
    'attributes.grpc.status_code',
    'rpc.grpc.status_code',
    'grpc.status_code',
    'grpcStatusCode',
    '_source.attributes.rpc.grpc.status_code',
    '_source.attributes.grpc.status_code',
    '_source.rpc.grpc.status_code',
    '_source.grpc.status_code',
  ]);

  return grpcStatusFromFields;
};

export const validateRequiredTraceFields = (
  rowData: OpenSearchSearchHit<Record<string, unknown>>
): {
  isValid: boolean;
  missingFields: string[];
  presentFields: string[];
} => {
  const missingFields: string[] = [];
  const presentFields: string[] = [];

  const spanId = extractFieldFromRowData(rowData, SPAN_ID_FIELD_PATHS);
  if (spanId) {
    presentFields.push('spanId');
  } else {
    missingFields.push('spanId');
  }

  const traceId = extractFieldFromRowData(rowData, TRACE_ID_FIELD_PATHS);
  if (traceId) {
    presentFields.push('traceId');
  } else {
    missingFields.push('traceId');
  }

  // For root spans, parentSpanId can be null or empty string
  // Also check Jaeger references array for parent span relationships
  const hasParentSpanIdField = PARENT_SPAN_ID_FIELD_PATHS.some((field) => {
    const value = getNestedValue(rowData, field);
    return value !== undefined;
  });

  // Check for Jaeger references array structure
  const jaegerReferences =
    getNestedValue(rowData, 'references') || getNestedValue(rowData, '_source.references');
  const hasJaegerParentRef = Array.isArray(jaegerReferences) && jaegerReferences.length > 0;

  if (hasParentSpanIdField || hasJaegerParentRef) {
    presentFields.push('parentSpanId');
  } else {
    missingFields.push('parentSpanId');
  }

  const serviceName = extractServiceNameFromRowData(rowData);
  if (serviceName) {
    presentFields.push('serviceName');
  } else {
    missingFields.push('serviceName');
  }

  const name = extractFieldFromRowData(rowData, SPAN_NAME_FIELD_PATHS);
  if (name) {
    presentFields.push('name');
  } else {
    missingFields.push('name');
  }

  const startTime = extractFieldFromRowData(rowData, START_TIME_FIELD_PATHS);
  if (startTime) {
    presentFields.push('startTime');
  } else {
    missingFields.push('startTime');
  }

  // For endTime validation, accept either endTime field OR startTime + duration (Jaeger pattern)
  const endTime = extractFieldFromRowData(rowData, END_TIME_FIELD_PATHS);
  const hasDuration =
    getNestedValue(rowData, 'duration') !== undefined ||
    getNestedValue(rowData, '_source.duration') !== undefined;

  if (endTime || (startTime && hasDuration)) {
    presentFields.push('endTime');
  } else {
    missingFields.push('endTime');
  }

  // status.code is optional - if missing, error indicators won't show but visualization won't break
  const hasStatusCodeField = STATUS_CODE_FIELD_PATHS.some((field) => {
    const value = getNestedValue(rowData, field);
    return value !== undefined;
  });

  const hasJaegerTags =
    Array.isArray(getNestedValue(rowData, 'tags')) ||
    Array.isArray(getNestedValue(rowData, '_source.tags'));

  if (hasStatusCodeField || hasJaegerTags) {
    presentFields.push('status.code');
  } else {
    missingFields.push('status.code');
  }

  const requiredMissingFields = missingFields.filter((field) => field !== 'status.code');

  return {
    isValid: requiredMissingFields.length === 0,
    missingFields,
    presentFields,
  };
};

export const getMissingFieldsDescription = (
  missingFields: string[]
): Array<{ name: string; description: string }> => {
  if (missingFields.length === 0) return [];

  const fieldDescriptions: Record<string, string> = {
    spanId: 'Used for span selection and highlighting',
    traceId: 'Required for trace identification',
    parentSpanId: 'Used to build hierarchical structure',
    serviceName: 'Displayed as labels and used for color coding',
    name: 'Displayed as operation labels',
    startTime: 'Positions spans on timeline',
    endTime: 'Determines span width/duration',
    'status.code': 'Used for error indicators',
  };

  return missingFields.map((field) => ({
    name: field,
    description: fieldDescriptions[field] || 'Required field',
  }));
};
