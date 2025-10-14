/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, SavedObjectReference } from '../../../../core/public';

/**
 * Correlation attributes matching the saved object schema
 */
export interface CorrelationAttributes {
  correlationType: string; // 'Traces-Logs-Correlation'
  version: string;
  entities: Array<{
    tracesDataset?: { id: string };
    logsDataset?: { id: string };
  }>;
}

/**
 * Correlation saved object with references to datasets
 */
export interface CorrelationSavedObject extends SavedObject<CorrelationAttributes> {
  type: 'correlations';
  references: SavedObjectReference[];
}

/**
 * Field mapping for trace-log correlation
 * These are the required fields in schemaMappings.otelLogs
 */
export interface FieldMapping {
  traceId: string;
  spanId: string;
  serviceName: string;
  timestamp: string;
}

/**
 * Result of correlation validation
 */
export interface CorrelationValidationResult {
  isValid: boolean;
  errors: FieldMappingError[];
}

/**
 * Error details for missing field mappings in a dataset
 */
export interface FieldMappingError {
  datasetId: string;
  datasetTitle: string;
  missingFields: string[];
}

/**
 * Options for finding correlations
 */
export interface FindCorrelationsOptions {
  datasetId?: string;
  page?: number;
  perPage?: number;
}

/**
 * Correlation creation data
 */
export interface CreateCorrelationData {
  traceDatasetId: string;
  logDatasetIds: string[];
  correlationType?: string;
  version?: string;
}

/**
 * Correlation update data
 */
export interface UpdateCorrelationData {
  id: string;
  logDatasetIds: string[];
}

/**
 * Constants for correlation types
 */
export const CORRELATION_TYPES = {
  TRACES_LOGS: 'Trace-to-logs',
} as const;

/**
 * Constants for correlation versions
 */
export const CORRELATION_VERSION = '1.0.0';

/**
 * Maximum number of log datasets allowed in a correlation
 */
export const MAX_LOG_DATASETS_PER_CORRELATION = 5;

/**
 * Required fields for OTel logs correlation
 */
export const REQUIRED_OTEL_LOGS_FIELDS = ['traceId', 'spanId', 'serviceName', 'timestamp'];
