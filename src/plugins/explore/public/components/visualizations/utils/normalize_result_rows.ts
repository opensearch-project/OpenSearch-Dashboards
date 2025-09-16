/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { FIELD_TYPE_MAP } from '../constants';
import { VisColumn, VisFieldType } from '../types';

interface FieldType {
  name: string;
  type: VisFieldType;
}

export const normalizeSearchHits = <T = unknown>(
  rows: Array<OpenSearchSearchHit<T>>,
  schema: Array<{ type?: string; name?: string }>
) => {
  const transformedData = rows.map((row: OpenSearchSearchHit) => {
    const transformedRow: Record<string, any> = {};
    for (const s of schema) {
      if (s.name) {
        // Type assertion for _source since it's marked as unknown
        const source = row._source as Record<string, any>;
        transformedRow[s.name] = source[s.name];
      }
    }
    return transformedRow;
  });
  return transformedData;
};

export const normalizeSearchHitsSchema = (schema: Array<{ type?: string; name?: string }>) => {
  const typeHints: Record<string, VisFieldType> = {};
  for (const s of schema) {
    if (s.name) {
      const type = s.type && FIELD_TYPE_MAP[s.type];
      typeHints[s.name] = type ? type : VisFieldType.Unknown;
    }
  }
  return typeHints;
};

export const getDataColumns = (
  rows: Array<Record<string, any>>,
  typeHints: Record<string, VisFieldType> = {}
) => {
  const columns: Record<string, FieldType> = {};
  const hints = { ...typeHints };

  for (const row of rows) {
    Object.keys(row).forEach((name) => {
      let type = hints[name] ?? VisFieldType.Unknown;

      if (type === VisFieldType.Unknown) {
        const valuePrimitiveType = typeof row[name];
        if (valuePrimitiveType === 'string' || valuePrimitiveType === 'boolean') {
          type = VisFieldType.Categorical;
        } else if (valuePrimitiveType === 'number' || valuePrimitiveType === 'bigint') {
          type = VisFieldType.Numerical;
        }
        hints[name] = type;
      }

      if (!columns[name]) {
        columns[name] = { name, type };
      }
    });
  }
  return columns;
};

export const getColumnStats = (
  columns: Record<string, FieldType>,
  rows: Array<Record<string, any>>
) => {
  const columnsWithStats: VisColumn[] = Object.values(columns).map((field, index) => {
    const values = rows.map((row) => row[field.name]);
    const validValues = values.filter((v) => v !== null && v !== undefined);
    const uniqueValues = new Set(validValues);
    return {
      id: index,
      name: field.name,
      schema: field.type,
      column: `field-${index}`,
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

  const transformedData = rows.map((row) => {
    const transformedRow: Record<string, any> = {};
    for (const column of columnsWithStats) {
      transformedRow[column.column] = row[column.name];
    }
    return transformedRow;
  });

  return { numericalColumns, categoricalColumns, dateColumns, transformedData };
};

export const normalizeResultRows = <T = unknown>(
  rows: Array<OpenSearchSearchHit<T>>,
  schema: Array<{ type?: string; name?: string }>
) => {
  const data = normalizeSearchHits(rows, schema);
  const typeHints = normalizeSearchHitsSchema(schema);
  return getColumnStats(getDataColumns(data, typeHints), rows);
};
