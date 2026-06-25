/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { FIELD_TYPE_MAP } from '../constants';
import { VisColumn, VisFieldType } from '../types';

export const normalizeResultRows = <T = unknown>(
  rows: Array<OpenSearchSearchHit<T>>,
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

  const transformedData = rows.map((row: OpenSearchSearchHit) => {
    const transformedRow: Record<string, any> = {};
    for (const column of columns) {
      // Type assertion for _source since it's marked as unknown
      const source = row._source as Record<string, any>;
      transformedRow[column.column] = source[column.name];
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
