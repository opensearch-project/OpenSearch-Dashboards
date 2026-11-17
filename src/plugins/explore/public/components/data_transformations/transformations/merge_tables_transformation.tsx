/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/utils';
import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/types';
import {
  FieldSchema,
  MultiSeriesTransformationInstance,
  NormalizedRow,
  SeriesExecutionResult,
  TransformationConfigSchema,
  TransformationDefinition,
} from '../types';
import { combinedRefId, mergeDisplayNames, rowsKey, skippedSeriesResult } from './series_utils';

type MergeTablesConfig = Record<string, never>;

const MergeTablesEditor = () => (
  <EuiText size="s" color="subdued" data-test-subj="mergeTablesTransformationHelp">
    {i18n.translate('explore.transformations.mergeTables.help', {
      defaultMessage:
        'Rows from different queries become one row when every field they share has the same value; other rows are kept as they are.',
    })}
  </EuiText>
);

/**
 * Merges the series into one table, joining on every field they share: a row merges into an
 * earlier one only when all shared fields hold the same values and the earlier row has no value
 * yet for the incoming row's other fields. Rows that match nothing are appended.
 */
export const mergeTablesMethod = (series: SeriesResult[]): SeriesExecutionResult => {
  if (series.length <= 1) return skippedSeriesResult(series);

  const [first, ...rest] = series;
  const fieldSchema: FieldSchema[] = [...first.fieldSchema];
  const rows: NormalizedRow[] = first.rows.map((row) => ({ ...row }));

  rest.forEach((oneSeries) => {
    const known = new Set(fieldSchema.map(({ name }) => name));
    const shared = oneSeries.fieldSchema.map(({ name }) => name).filter((name) => known.has(name));
    const own = oneSeries.fieldSchema.map(({ name }) => name).filter((name) => !known.has(name));
    oneSeries.fieldSchema.forEach((field) => {
      if (!known.has(field.name)) fieldSchema.push(field);
    });

    if (shared.length === 0) {
      rows.push(...oneSeries.rows.map((row) => ({ ...row })));
      return;
    }

    // Shared values -> rows holding them, in table order.
    const byKey = new Map<string, NormalizedRow[]>();
    rows.forEach((row) => {
      const key = rowsKey(row, shared);
      // byKey.set(key, [...(byKey.get(key) ?? []), row]);
      const list = byKey.get(key);
      if (list) list.push(row);
      else byKey.set(key, [row]);
    });

    // Rows this series already merged into: each takes one row of the series, so an identical
    // row (no own fields to fill) is kept as its own row instead of vanishing into the first.
    const used = new Set<NormalizedRow>();
    oneSeries.rows.forEach((row) => {
      const candidates = byKey.get(rowsKey(row, shared)) ?? [];
      // const target = candidates.find((candidate) =>
      //   own.every((name) => candidate[name] === undefined)
      // );
      const target = candidates.find(
        (candidate) => !used.has(candidate) && own.every((name) => candidate[name] === undefined)
      );
      if (target) {
        used.add(target);
        own.forEach((name) => {
          if (row[name] !== undefined) target[name] = row[name];
        });
      } else {
        const added = { ...row };
        rows.push(added);
        // The series's own row: a later row of the same series doesn't merge into it.
        used.add(added);
        const key = rowsKey(added, shared);
        // byKey.set(key, [...(byKey.get(key) ?? []), added]);
        const list = byKey.get(key);
        if (list) list.push(added);
        else byKey.set(key, [added]);
      }
    });
  });

  return {
    series: [
      {
        refId: combinedRefId(series),
        rows,
        fieldSchema,
        seriesDisplayNames: mergeDisplayNames(series),
      },
    ],
    status: 'applied',
    issues: [],
  };
};

export function createMergeTablesTransformation(): MultiSeriesTransformationInstance<MergeTablesConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'merge_tables',
    config: {},
    hide: false,
    seriesMethod: mergeTablesMethod,
    Editor: MergeTablesEditor,
  };
}

export const mergeTablesTransformationDefinition: TransformationDefinition<MergeTablesConfig> = {
  id: 'merge_tables',
  type: 'combine',
  label: i18n.translate('explore.transformations.mergeTables.label', {
    defaultMessage: 'Merge tables',
  }),
  description: i18n.translate('explore.transformations.mergeTables.description', {
    defaultMessage:
      'Merge rows from every query into one table; rows with the same values in shared fields become one row.',
  }),
  iconType: 'merge',
  createInstance: createMergeTablesTransformation,
};

export const mergeTablesConfigSchema: TransformationConfigSchema = {};
