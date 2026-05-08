/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataView } from '../../../data/public';
import {
  CorrelationSavedObject,
  FieldMappingError,
  CorrelationValidationResult,
  MAX_LOG_DATASETS_PER_CORRELATION,
  REQUIRED_OTEL_LOGS_FIELDS,
} from '../types/correlations';

/**
 * Validates that a trace dataset is not already part of another correlation
 * Business rule: A trace dataset can only be part of 1 correlation
 */
export function validateCorrelationConstraints(
  traceDatasetId: string,
  existingCorrelations: CorrelationSavedObject[],
  currentCorrelationId?: string
): { isValid: boolean; error?: string } {
  const existingCorrelation = existingCorrelations.find((corr) => {
    // Skip the current correlation if we're editing
    if (currentCorrelationId && corr.id === currentCorrelationId) {
      return false;
    }

    // Check if this trace dataset is referenced in any correlation
    return corr.references.some((ref) => ref.type === 'index-pattern' && ref.id === traceDatasetId);
  });

  if (existingCorrelation) {
    return {
      isValid: false,
      error: `This trace dataset is already part of correlation "${existingCorrelation.id}". A trace dataset can only be part of one correlation.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that the number of log datasets does not exceed the maximum allowed
 * Business rule: Max 5 log datasets per correlation
 */
export function validateMaxLogDatasets(
  logDatasetIds: string[]
): {
  isValid: boolean;
  error?: string;
} {
  if (logDatasetIds.length > MAX_LOG_DATASETS_PER_CORRELATION) {
    return {
      isValid: false,
      error: `Cannot select more than ${MAX_LOG_DATASETS_PER_CORRELATION} log datasets. Currently selected: ${logDatasetIds.length}`,
    };
  }

  if (logDatasetIds.length === 0) {
    return {
      isValid: false,
      error: 'At least one log dataset must be selected',
    };
  }

  return { isValid: true };
}

/**
 * Checks if a dataset has the required field mappings in schemaMappings.otelLogs
 */
export function checkMissingFieldMappings(dataset: DataView): string[] {
  const missingFields: string[] = [];

  try {
    // Parse schemaMappings if it's a string
    const schemaMappings =
      typeof dataset.schemaMappings === 'string'
        ? JSON.parse(dataset.schemaMappings)
        : dataset.schemaMappings;

    if (!schemaMappings || !schemaMappings.otelLogs) {
      return REQUIRED_OTEL_LOGS_FIELDS;
    }

    const otelLogs = schemaMappings.otelLogs;

    // Check each required field
    REQUIRED_OTEL_LOGS_FIELDS.forEach((field) => {
      if (!otelLogs[field] || otelLogs[field].trim() === '') {
        missingFields.push(field);
      }
    });
  } catch (error) {
    // If parsing fails, assume all fields are missing
    return REQUIRED_OTEL_LOGS_FIELDS;
  }

  return missingFields;
}

/**
 * Validates field mappings for multiple datasets
 */
export function validateFieldMappings(datasets: DataView[]): CorrelationValidationResult {
  const errors: FieldMappingError[] = [];

  datasets.forEach((dataset) => {
    const missingFields = checkMissingFieldMappings(dataset);

    if (missingFields.length > 0) {
      errors.push({
        datasetId: dataset.id || '',
        datasetTitle: dataset.title,
        missingFields,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the list of required fields for OTel logs correlation
 */
export function getRequiredFields(): string[] {
  return [...REQUIRED_OTEL_LOGS_FIELDS];
}

/**
 * Checks if a dataset has valid field mappings
 */
export function hasValidFieldMappings(dataset: DataView): boolean {
  return checkMissingFieldMappings(dataset).length === 0;
}

/**
 * Gets a user-friendly error message for field mapping validation
 */
export function getFieldMappingErrorMessage(errors: FieldMappingError[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    const error = errors[0];
    return `Dataset "${
      error.datasetTitle
    }" is missing required field mappings: ${error.missingFields.join(', ')}`;
  }

  return `${errors.length} datasets are missing required field mappings. Please configure them before saving.`;
}

/**
 * Validates if a dataset is a valid logs dataset for correlation
 */
export function isValidLogsDataset(dataset: DataView): boolean {
  return dataset.signalType === 'logs';
}

/**
 * Validates if a dataset is a valid trace dataset for correlation
 */
export function isValidTraceDataset(dataset: DataView): boolean {
  return dataset.signalType === 'traces';
}
