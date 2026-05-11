/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { FIELD_TYPE_MAP } from '../constants';
import { VisColumn, VisFieldType } from '../types';
import { normalizeField } from './field';

export const normalizeResultRows = <T = unknown>(
  rows: Array<OpenSearchSearchHit<T>>,
  schema: Array<{ type?: string; name?: string }>
) => {
  const columns: VisColumn[] = [];
  schema.forEach((field, index) => {
    if (field.name) {
      const type = field.type ? FIELD_TYPE_MAP[field.type] : VisFieldType.Unknown;
      const column: VisColumn = {
        id: index,
        schema: type ?? VisFieldType.Unknown,
        name: field.name,
        column: normalizeField(field.name),
        validValuesCount: 0,
        uniqueValuesCount: 0,
      };
      columns.push(column);
    }
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
