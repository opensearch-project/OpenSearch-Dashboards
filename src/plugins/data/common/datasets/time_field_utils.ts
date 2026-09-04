/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isNestedField } from '../index_patterns/fields';
import { DatasetField } from './types';

/**
 * Whether a dataset field can be used as a time field for a Date Histogram aggregation.
 *
 * This mirrors the availability rules enforced by `FieldParamType` in the aggs framework
 * (see `data/common/search/aggs/param_types/field.ts`): a field must be a date, aggregatable,
 * and not live inside a nested object. Filtering the time-field picker with the same rules
 * prevents offering fields such as the nested `events.time` on otel trace indices, which would
 * otherwise be selectable but fail later with
 * "Saved field ... is invalid for use with the Date Histogram aggregation".
 */
export const isValidTimeField = (field: DatasetField): boolean =>
  field.type === 'date' && field.aggregatable !== false && !isNestedField(field);

/**
 * Default time-field candidate precedence — Data Prepper OTel mappings + PPL's expected default
 * timestamp fields. When an index has several date fields we pick the first match in the
 * provided candidate list, falling back to the first entry in `dateFieldNames`.
 *
 * Consumers that need domain-specific ordering (e.g. traces preferring `startTime`) pass their
 * own candidate list; the general-purpose default matches the OTel/PPL convention.
 */
export const DEFAULT_TIME_FIELD_CANDIDATES = [
  '@timestamp',
  'time',
  'startTime',
  'endTime',
  'timestamp',
  'observedTimestamp',
];

/** Trace-specific time-field preference: `startTime` is the canonical OTel span start timestamp. */
export const TRACE_TIME_FIELD_CANDIDATES = ['startTime', 'endTime'];

/**
 * Choose the default time field from an index's date-typed field names. Selects the first name in
 * `candidates` that exists in `dateFieldNames`, else falls back to `dateFieldNames[0]`.
 *
 * @param dateFieldNames - field names known to be valid date fields.
 * @param candidates - ordered preference list (default: {@link DEFAULT_TIME_FIELD_CANDIDATES}).
 * @returns The best time field, or `undefined` if `dateFieldNames` is empty.
 */
export const pickTimeField = (
  dateFieldNames: string[],
  candidates: string[] = DEFAULT_TIME_FIELD_CANDIDATES
): string | undefined => {
  if (dateFieldNames.length === 0) return undefined;
  const set = new Set(dateFieldNames);
  return candidates.find((f) => set.has(f)) ?? dateFieldNames[0];
};
