/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, has } from 'lodash';
import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES, PPL_FIELD_TYPES } from '../../../../data/common';
import {
  FieldSchema,
  TransformationInstance,
  TransformationPipeline,
  TransformationExecutionResult,
  TransformationExecutionStatus,
  NormalizedRow,
} from './types';

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:[T ][0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

const isDateValue = (value: unknown): boolean =>
  value instanceof Date ||
  (typeof value === 'string' && ISO_DATE_PATTERN.test(value) && !isNaN(Date.parse(value)));

const NUMERICAL_FIELD_TYPES = new Set<string>([
  OSD_FIELD_TYPES.NUMBER,
  OSD_FIELD_TYPES.HISTOGRAM,
  OPENSEARCH_FIELD_TYPES.FLOAT,
  OPENSEARCH_FIELD_TYPES.HALF_FLOAT,
  OPENSEARCH_FIELD_TYPES.SCALED_FLOAT,
  OPENSEARCH_FIELD_TYPES.DOUBLE,
  OPENSEARCH_FIELD_TYPES.INTEGER,
  OPENSEARCH_FIELD_TYPES.INT,
  OPENSEARCH_FIELD_TYPES.LONG,
  OPENSEARCH_FIELD_TYPES.SHORT,
  OPENSEARCH_FIELD_TYPES.UNSIGNED_LONG,
  PPL_FIELD_TYPES.TINYINT,
  PPL_FIELD_TYPES.SMALLINT,
  PPL_FIELD_TYPES.BIGINT,
]);

const DATE_FIELD_TYPES = new Set<string>([
  OSD_FIELD_TYPES.DATE,
  OPENSEARCH_FIELD_TYPES.DATE_NANOS,
  PPL_FIELD_TYPES.TIMESTAMP,
  PPL_FIELD_TYPES.TIME,
]);

export const isNumericalField = (field?: FieldSchema): boolean =>
  !!field?.type && NUMERICAL_FIELD_TYPES.has(field.type);

export const isDateField = (field?: FieldSchema): boolean =>
  !!field?.type && DATE_FIELD_TYPES.has(field.type);

export function addTransformation(
  currentPipe: TransformationPipeline,
  instance: TransformationInstance
): TransformationPipeline {
  return [...currentPipe, instance];
}

export function removeTransformation(
  registry: TransformationPipeline,
  instanceId: string
): TransformationPipeline {
  return registry.filter((instance) => instance.instance_id !== instanceId);
}

export function updateTransformationConfig(
  registry: TransformationPipeline,
  instanceId: string,
  newConfig: Record<string, unknown>
): TransformationPipeline {
  return registry.map((instance) =>
    instance.instance_id === instanceId
      ? { ...instance, config: { ...instance.config, ...newConfig } }
      : instance
  );
}

export function toggleTransformationHide(
  registry: TransformationPipeline,
  instanceId: string
): TransformationPipeline {
  return registry.map((instance) =>
    instance.instance_id === instanceId ? { ...instance, hide: !instance.hide } : instance
  );
}

export function createAppliedResult(rows: NormalizedRow[]): TransformationExecutionResult {
  return { rows, status: 'applied', issues: [] };
}

export function createInvalidConfigResult(
  rows: NormalizedRow[],
  message: string
): TransformationExecutionResult {
  return {
    rows,
    status: 'skipped',
    issues: [{ code: 'invalid_config', message }],
  };
}

export function createMissingFieldsResult(
  rows: NormalizedRow[],
  fields: string[],
  status: Extract<TransformationExecutionStatus, 'partially_applied' | 'skipped'> = 'skipped'
): TransformationExecutionResult {
  const uniqueFields = Array.from(new Set(fields));
  const message =
    uniqueFields.length === 1
      ? `Field is unavailable in the current data: ${uniqueFields[0]}`
      : `Fields are unavailable in the current data: ${uniqueFields.join(', ')}`;

  return {
    rows,
    status,
    issues: [
      {
        code: 'missing_fields',
        fields: uniqueFields,
        message,
      },
    ],
  };
}

export function rowHasField(row: NormalizedRow, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(row, field) || has(row, field);
}

export function getRowFieldValue(row: NormalizedRow, field: string): unknown {
  return Object.prototype.hasOwnProperty.call(row, field) ? row[field] : get(row, field);
}

const inferType = (value: unknown): string => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'double';
  }
  if (isDateValue(value)) {
    return 'date';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (value != null && typeof value === 'object') {
    return 'object';
  }
  return 'unknown';
};

export function inferSchemaFromRows(rows: NormalizedRow[]): Array<{ name: string; type: string }> {
  const fieldValues = new Map<string, unknown>();

  for (const row of rows) {
    for (const [name, value] of Object.entries(row)) {
      if (!fieldValues.has(name) || fieldValues.get(name) == null) {
        fieldValues.set(name, value);
      }
    }
  }

  return Array.from(fieldValues, ([name, value]) => ({ name, type: inferType(value) }));
}
