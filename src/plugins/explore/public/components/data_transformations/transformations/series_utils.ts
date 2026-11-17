/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/utils';
import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/types';
import { FieldSchema, NormalizedRow, SeriesExecutionResult, TransformationIssue } from '../types';
import { isDateField, isNumericalField } from '../transformation_utils';

/** The refId of a series combined from several: their refIds, as mergeSeries names it. */
export const combinedRefId = (series: SeriesResult[]) => series.map(({ refId }) => refId).join(',');

export const mergeDisplayNames = (series: SeriesResult[]): Record<string, string> | undefined =>
  series.reduce<Record<string, string> | undefined>(
    (acc, { seriesDisplayNames }) =>
      seriesDisplayNames ? { ...(acc ?? {}), ...seriesDisplayNames } : acc,
    undefined
  );

// No callers: concatenate no longer gives fields a `name (refId)` display name.
// /** A field's display name tagged with its query: `count (A)`, from the query's own display name. */
// export const rebuildFieldDisplayName = (oneSeries: SeriesResult, name: string) =>
//   `${oneSeries.seriesDisplayNames?.[name] ?? name} (${oneSeries.refId})`;

/** A combine step with fewer than two series has nothing to combine: skipped, without an issue. */
export const skippedSeriesResult = (
  series: SeriesResult[],
  issues: TransformationIssue[] = []
): SeriesExecutionResult => ({ series, status: 'skipped', issues });

export const invalidConfigSeriesResult = (
  series: SeriesResult[],
  message: string
): SeriesExecutionResult => skippedSeriesResult(series, [{ code: 'invalid_config', message }]);

export const missingFieldsIssue = (fields: string[]): TransformationIssue => {
  const unique = Array.from(new Set(fields));
  return {
    code: 'missing_fields',
    fields: unique,
    message:
      unique.length === 1
        ? `Field is unavailable in the current data: ${unique[0]}`
        : `Fields are unavailable in the current data: ${unique.join(', ')}`,
  };
};

export const hasField = (oneSeries: SeriesResult, name: string) =>
  oneSeries.fieldSchema.some((field) => field.name === name) ||
  oneSeries.rows.some((row) => Object.prototype.hasOwnProperty.call(row, name));

/** A series's time field: the first date field, else a field named Time / time. */
export const findTimeField = (fieldSchema: FieldSchema[]): FieldSchema | undefined =>
  fieldSchema.find((field) => isDateField(field)) ??
  fieldSchema.find(({ name }) => name === 'Time' || name === 'time');

export const numericalFields = (fieldSchema: FieldSchema[], exclude: string[] = []) =>
  fieldSchema.filter((field) => isNumericalField(field) && !exclude.includes(field.name));

const STRING_FIELD_TYPES = new Set(['string', 'keyword', 'text']);

export const stringFields = (fieldSchema: FieldSchema[], exclude: string[] = []) =>
  fieldSchema.filter(({ name, type }) => STRING_FIELD_TYPES.has(type) && !exclude.includes(name));

// A value as a join / merge key: same value, same key; null and undefined both missing.
export const toKey = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (value instanceof Date) return `d:${value.getTime()}`;
  return typeof value === 'object' ? `o:${JSON.stringify(value)}` : `${typeof value}:${value}`;
};

export const rowsKey = (row: NormalizedRow, fields: string[]) =>
  JSON.stringify(fields.map((field) => toKey(row[field]) ?? null));
