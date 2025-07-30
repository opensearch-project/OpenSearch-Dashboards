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
      column: `field-${index}`,
      validValuesCount: 0,
      uniqueValuesCount: 0,
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

  // count validValues and uniqueValues
  const columnsWithStats: VisColumn[] = columns.map((column) => {
    const values = transformedData.map((row) => row[column.column]);
    const validValues = values.filter((v) => v !== null && v !== undefined);
    const uniqueValues = new Set(validValues);
    return {
      ...column,
      validValuesCount: validValues.length ?? 0,
      uniqueValuesCount: uniqueValues.size ?? 0,
    };
  });

  const numericalColumns = columnsWithStats.filter(
    (column) => column.schema === VisFieldType.Numerical
  );
  const categoricalColumns = columnsWithStats.filter(
    (column) => column.schema === VisFieldType.Categorical
  );
  const dateColumns = columnsWithStats.filter((column) => column.schema === VisFieldType.Date);

  return { transformedData, numericalColumns, categoricalColumns, dateColumns };
};
