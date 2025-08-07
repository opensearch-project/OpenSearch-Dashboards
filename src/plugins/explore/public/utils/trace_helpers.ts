/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SPAN_ID_FIELD_PATHS,
  STATUS_CODE_FIELD_PATHS,
  HTTP_STATUS_CODE_FIELD_PATHS,
  SERVICE_NAME_FIELD_PATHS,
  SPAN_NAME_FIELD_PATHS,
  DURATION_FIELD_PATHS,
} from './trace_field_constants';

interface TraceColumnConfig {
  field: string;
  name: string;
  width: number;
  sortable: boolean;
  truncateText?: boolean;
}

/**
 * Default columns configuration for trace flavor
 * Order: Time / spanId / status.code / attributes.http.status_code / serviceName / name / durationInNanos
 */
export const TRACE_DEFAULT_COLUMNS: TraceColumnConfig[] = [
  {
    field: '@timestamp',
    name: 'Time',
    width: 180,
    sortable: true,
  },
  {
    field: 'spanId',
    name: 'Span ID',
    width: 140,
    sortable: true,
    truncateText: true,
  },
  {
    field: 'status.code',
    name: 'Status Code',
    width: 100,
    sortable: true,
  },
  {
    field: 'attributes.http.status_code',
    name: 'HTTP Status',
    width: 100,
    sortable: true,
  },
  {
    field: 'serviceName',
    name: 'Service Name',
    width: 150,
    sortable: true,
    truncateText: true,
  },
  {
    field: 'name',
    name: 'Name',
    width: 200,
    sortable: true,
    truncateText: true,
  },
  {
    field: 'durationInNanos',
    name: 'Duration (ns)',
    width: 120,
    sortable: true,
  },
];

/**
 * Get the first available field from a list of possible field paths
 * This helps handle different trace data formats and field naming conventions
 */
export const getFirstAvailableField = (
  fieldPaths: readonly string[],
  availableFields: string[]
): string | undefined => {
  return fieldPaths.find((path) => availableFields.includes(path));
};

/**
 * Get trace-specific default columns based on available fields in the dataset
 * This function adapts the default columns to match the actual field names in the data
 */
export const getTraceDefaultColumns = (availableFields: string[]): TraceColumnConfig[] => {
  return TRACE_DEFAULT_COLUMNS.map((column) => {
    // For trace-specific fields, try to find the actual field name
    let actualField = column.field;

    switch (column.field) {
      case 'spanId':
        actualField = getFirstAvailableField(SPAN_ID_FIELD_PATHS, availableFields) || column.field;
        break;
      case 'status.code':
        actualField =
          getFirstAvailableField(STATUS_CODE_FIELD_PATHS, availableFields) || column.field;
        break;
      case 'attributes.http.status_code':
        actualField =
          getFirstAvailableField(HTTP_STATUS_CODE_FIELD_PATHS, availableFields) || column.field;
        break;
      case 'serviceName':
        actualField =
          getFirstAvailableField(SERVICE_NAME_FIELD_PATHS, availableFields) || column.field;
        break;
      case 'name':
        actualField =
          getFirstAvailableField(SPAN_NAME_FIELD_PATHS, availableFields) || column.field;
        break;
      case 'durationInNanos':
        actualField = getFirstAvailableField(DURATION_FIELD_PATHS, availableFields) || column.field;
        break;
    }

    return {
      ...column,
      field: actualField,
    };
  }).filter(
    (column) =>
      // Only include columns where we found a matching field or it's a standard field like @timestamp
      column.field === '@timestamp' || availableFields.includes(column.field)
  );
};

/**
 * Determines if the current page is using the trace flavor
 * This is used to conditionally render trace-specific UI components
 */
export const isTraceFlavor = (): boolean => {
  // Check if the current URL path contains '/traces'
  return window.location.pathname.includes('/traces');
};
