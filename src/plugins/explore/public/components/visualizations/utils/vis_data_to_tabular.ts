/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormattedData } from '../../../../../inspector/public';
import { IndexPattern } from '../../../../../data/common';
import { VisData } from '../visualization_builder.types';
import { VisColumn, VisFieldType } from '../types';
import { FIELD_TYPE_MAP } from '../constants';

export interface VisTabularColumn {
  name: string;
  field: string;
}

export interface VisTabular {
  columns: VisTabularColumn[];
  rows: Array<Record<string, FormattedData>>;
}

// Plain-string fallback; objects and arrays are serialized instead of becoming "[object Object]".
const toPlainString = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

/**
 * Returns the index-pattern formatter for a column only when the field's type still matches
 * the column's schema.
 * A transformation (e.g. Convert Field Type) can keep the column name while
 * changing its values, so the original field's formatter would no longer fit.
 */
const getColumnFormatter = (col: VisColumn, indexPattern?: IndexPattern) => {
  if (!indexPattern?.getFormatterForField) return undefined;
  const field = indexPattern.fields.getByName(col.name);
  if (!field) return undefined;
  const fieldSchema = FIELD_TYPE_MAP[field.type] ?? VisFieldType.Unknown;
  return fieldSchema === col.schema ? indexPattern.getFormatterForField(field) : undefined;
};

/**
 * Turns visualization data into the table the visualization shows: its columns in result order and
 * each value as {raw, formatted}. Shared by the Inspector data view and the CSV export, so both list
 * the same columns.
 */
export const visDataToTabular = (visData: VisData, indexPattern?: IndexPattern): VisTabular => {
  const allColumns = [
    ...(visData.numericalColumns ?? []),
    ...(visData.categoricalColumns ?? []),
    ...(visData.dateColumns ?? []),
    ...(visData.unknownColumns ?? []),
  ].sort((a, b) => a.id - b.id);

  // Resolve each column's formatter once instead of per row
  const formatters = allColumns.map((col) => getColumnFormatter(col, indexPattern));

  return {
    columns: allColumns.map((col) => ({
      name: col.name,
      field: col.column,
    })),

    // format data rows and transform into shape {raw, formatted}
    rows: (visData.transformedData ?? []).map((row) => {
      const formattedRow: Record<string, FormattedData> = {};
      allColumns.forEach((col, i) => {
        const value = row[col.column];
        const formatter = formatters[i];
        const formatted = formatter ? formatter.convert(value) : toPlainString(value);
        formattedRow[col.column] = new FormattedData(value, formatted);
      });
      return formattedRow;
    }),
  };
};
