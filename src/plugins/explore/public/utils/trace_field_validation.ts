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
  'startTimeUnixNano',
  'startTime',
  '_source.startTimeUnixNano',
  '_source.startTime',
  'fields.startTimeUnixNano',
  'fields.startTime',
] as const;

export const END_TIME_FIELD_PATHS = [
  'endTimeUnixNano',
  'endTime',
  '_source.endTimeUnixNano',
  '_source.endTime',
  'fields.endTimeUnixNano',
  'fields.endTime',
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

  // parentSpanId can be an empty string for root spans, which is valid
  // only consider it missing if the field doesn't exist at all
  const hasParentSpanIdField = PARENT_SPAN_ID_FIELD_PATHS.some((field) => {
    const value = getNestedValue(rowData, field);
    return value !== undefined && value !== null;
  });

  if (hasParentSpanIdField) {
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

  const endTime = extractFieldFromRowData(rowData, END_TIME_FIELD_PATHS);
  if (endTime) {
    presentFields.push('endTime');
  } else {
    missingFields.push('endTime');
  }

  // status.code is optional - if missing, error indicators won't show but visualization won't break
  // only consider it missing if the field doesn't exist at all
  const hasStatusCodeField = STATUS_CODE_FIELD_PATHS.some((field) => {
    const value = getNestedValue(rowData, field);
    return value !== undefined && value !== null;
  });

  if (hasStatusCodeField) {
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
