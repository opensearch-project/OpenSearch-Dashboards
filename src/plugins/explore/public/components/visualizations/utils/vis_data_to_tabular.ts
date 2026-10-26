/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormattedData } from '../../../../../inspector/public';
import { IndexPattern } from '../../../../../data/common';
import { VisData } from '../visualization_builder.types';

export interface VisTabularColumn {
  name: string;
  field: string;
}

export interface VisTabular {
  columns: VisTabularColumn[];
  rows: Array<Record<string, FormattedData>>;
}

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

  return {
    columns: allColumns.map((col) => ({
      name: col.name,
      field: col.column,
    })),

    // format data rows and transform into shape {raw, formatted}
    rows: (visData.transformedData ?? []).map((row) => {
      const formattedRow: Record<string, FormattedData> = {};
      for (const col of allColumns) {
        const value = row[col.column];
        const field = indexPattern?.fields.getByName(col.name);
        const formatted =
          field && indexPattern?.getFormatterForField
            ? indexPattern.getFormatterForField(field).convert(value)
            : String(value ?? '');
        formattedRow[col.column] = new FormattedData(value, formatted);
      }
      return formattedRow;
    }),
  };
};
