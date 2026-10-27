/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { NormalizedRow } from '../../data_transformations/types';
import { FIELD_TYPE_MAP } from '../constants';
import { VisColumn, VisFieldType } from '../types';

export const normalizeSearchHits = <T = unknown>(
  hits: Array<OpenSearchSearchHit<T>>
): NormalizedRow[] =>
  hits.map((hit) => ({ ...((hit._source as NormalizedRow | undefined) ?? {}) }));

export const normalizeResultRows = (
  rows: NormalizedRow[],
  schema: Array<{ type?: string; name?: string }>
) => {
  const columns: VisColumn[] = schema.map((field, index) => {
    return {
      id: index,
      schema: FIELD_TYPE_MAP[field.type || ''] || VisFieldType.Unknown,
      name: field.name || '',
      column: field.name || '',
    };
  });

  const transformedData = rows.map((row) => {
    const transformedRow: Record<string, any> = {};
    for (const column of columns) {
      transformedRow[column.column] = row[column.name];
    }
    return transformedRow;
  });

  const numericalColumns = columns.filter((column) => column.schema === VisFieldType.Numerical);
  const categoricalColumns = columns.filter((column) => column.schema === VisFieldType.Categorical);
  const dateColumns = columns.filter((column) => column.schema === VisFieldType.Date);

  // unknownColumns should only be used for table display, not for the auto-vis logic
  const unknownColumns = columns.filter((column) => column.schema === VisFieldType.Unknown);

  return { transformedData, numericalColumns, categoricalColumns, dateColumns, unknownColumns };
};
