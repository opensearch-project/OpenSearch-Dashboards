/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, has } from 'lodash';
import {
  TransformationInstance,
  TransformationPipeline,
  TransformationExecutionResult,
  TransformationExecutionStatus,
} from './types';
import { OpenSearchSearchHit } from '../../types/doc_views_types';

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:[T ][0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

const isDateValue = (value: unknown): boolean =>
  value instanceof Date ||
  (typeof value === 'string' && ISO_DATE_PATTERN.test(value) && !isNaN(Date.parse(value)));

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

export function createAppliedResult(rows: OpenSearchSearchHit[]): TransformationExecutionResult {
  return { rows, status: 'applied', issues: [] };
}

export function createInvalidConfigResult(
  rows: OpenSearchSearchHit[],
  message: string
): TransformationExecutionResult {
  return {
    rows,
    status: 'skipped',
    issues: [{ code: 'invalid_config', message }],
  };
}

export function createMissingFieldsResult(
  rows: OpenSearchSearchHit[],
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

export function rowHasField(row: OpenSearchSearchHit, field: string): boolean {
  const source = (row._source as Record<string, unknown>) ?? {};
  return Object.prototype.hasOwnProperty.call(source, field) || has(source, field);
}

export function getRowFieldValue(row: OpenSearchSearchHit, field: string): unknown {
  const source = (row._source as Record<string, unknown>) ?? {};
  return Object.prototype.hasOwnProperty.call(source, field) ? source[field] : get(source, field);
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

export function inferSchemaFromRows(
  rows: OpenSearchSearchHit[]
): Array<{ name: string; type: string }> {
  const fieldValues = new Map<string, unknown>();

  for (const row of rows) {
    const source = (row._source as Record<string, unknown>) ?? {};
    for (const [name, value] of Object.entries(source)) {
      if (!fieldValues.has(name) || fieldValues.get(name) == null) {
        fieldValues.set(name, value);
      }
    }
  }

  return Array.from(fieldValues, ([name, value]) => ({ name, type: inferType(value) }));
}
