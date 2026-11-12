/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldSchema, NormalizedRow } from './types';
import type { SeriesResult } from '../../application/in_context_vis_editor/multi_query_builder/types';

// The column that tells which query a merged row came from. Not "Series": PromQL results already have a Series column.
export const MERGED_QUERY_FIELD = 'Query';

// A name no input uses, so the query column never overwrites a real field.
export const uniqueFieldName = (base: string, taken: Set<string>) => {
  let name = base;
  let suffix = 1;
  while (taken.has(name)) {
    name = `${base}_${suffix}`;
    suffix += 1;
  }
  return name;
};

/**
 * Merge series is the pipeline's implicit last step and default transformation if no transformation is provided.
 *  Rows are stacked in series order and
 * tagged with their refId in a `Query` column; fields are the union, a same-name, other-type field
 * renamed `name (refId)`. One series passes through unchanged, without the `Query` column. *
 * @example
 * input
 * [
 *   { refId: 'A', fieldSchema: [{ name: 'time', type: 'date' }, { name: 'count', type: 'long' }],
 *     rows: [{ time: 't1', count: 1 }] },
 *   { refId: 'B', fieldSchema: [{ name: 'time', type: 'date' }, { name: 'count', type: 'string' },
 *     { name: 'host', type: 'string' }],
 *     rows: [{ time: 't2', count: 'n/a', host: 'h1' }] },
 * ]
 * output
 * {
 *   refId: 'A,B',
 *   queryField: 'Query',
 *   fieldSchema: [
 *     { name: 'time', type: 'date' }, { name: 'count', type: 'long' },
 *     { name: 'count (B)', type: 'string' }, { name: 'host', type: 'string' },
 *     { name: 'Query', type: 'string' },
 *   ],
 *   rows: [
 *     { time: 't1', count: 1, Query: 'A' },
 *     { time: 't2', 'count (B)': 'n/a', host: 'h1', Query: 'B' },
 *   ],
 * }
 */

export const mergeSeries = (series: SeriesResult[]): SeriesResult & { queryField?: string } => {
  if (series.length === 0) {
    return { refId: '', rows: [], fieldSchema: [] };
  }
  if (series.length === 1) {
    return series[0];
  }

  // Union of fields in first-seen order: name -> type.
  const fieldTypes = new Map<string, string>();
  /**
   * Per series: original name -> merged name, only for the fields that get renamed. Builds
   * fieldTypes on the way. A name seen before with the same type is reused; with another type,
   * the later series' field is renamed `name (refId)`.
   * A series' map is empty when none of its fields conflict.
   * For example:
   * input:  A: time:date, count:number;  B: time:date, count:string
   * output: fieldTypes      = Map { time => date, count => number, 'count (B)' => string }
   */
  const renamesBySeries = series.map(({ refId, fieldSchema }) => {
    const renames = new Map<string, string>();
    fieldSchema.forEach(({ name, type }) => {
      if (!fieldTypes.has(name)) {
        fieldTypes.set(name, type);
        return;
      }
      if (fieldTypes.get(name) === type) return;
      // Same name, different type: keep both, the later one adds query-scoped name.
      const renamed = uniqueFieldName(`${name} (${refId})`, new Set(fieldTypes.keys()));
      fieldTypes.set(renamed, type);
      renames.set(name, renamed);
    });
    return renames;
  });

  const queryField = uniqueFieldName(MERGED_QUERY_FIELD, new Set(fieldTypes.keys()));

  const rows = series.flatMap(({ refId, rows: seriesRows }, index) => {
    const renames = renamesBySeries[index];
    return seriesRows.map((row) => {
      const merged: NormalizedRow = {};
      Object.keys(row).forEach((key) => {
        merged[renames.get(key) ?? key] = row[key];
      });
      merged[queryField] = refId;
      return merged;
    });
  });

  const fieldSchema: FieldSchema[] = [
    ...Array.from(fieldTypes, ([name, type]) => ({ name, type })),
    { name: queryField, type: 'string' },
  ];

  const seriesDisplayNames = series.reduce<Record<string, string> | undefined>(
    (acc, oneSeries) =>
      oneSeries.seriesDisplayNames ? { ...(acc ?? {}), ...oneSeries.seriesDisplayNames } : acc,
    undefined
  );

  return {
    refId: series.map(({ refId }) => refId).join(','),
    rows,
    fieldSchema,
    seriesDisplayNames,
    queryField,
  };
};
