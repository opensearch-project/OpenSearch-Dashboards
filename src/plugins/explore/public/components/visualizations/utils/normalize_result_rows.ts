/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { FIELD_TYPE_MAP } from '../constants';
import { VisColumn, VisFieldType } from '../types';

/**
 * Normalize date string values returned from queries.
 *
 * PPL returns datetime fields as UTC strings without timezone info
 * (e.g. "2025-09-24 14:50:00"). To ensure correct parsing in visualizations,
 * we standardize them into ISO 8601 with explicit UTC suffix
 * (e.g. "2025-09-24T14:50:00Z").
 */
export const normalizeDateString = (value: string): string => {
  if (!value) return value;
  if (value.includes('T') && value.endsWith('Z')) {
    return value;
  }
  return value.replace(' ', 'T') + 'Z';
};

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
      let value = source[column.name];
      if (column.schema === VisFieldType.Date && typeof value === 'string') {
        value = normalizeDateString(value);
      }
      transformedRow[column.column] = value;
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
