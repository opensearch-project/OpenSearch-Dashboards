/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterOperator, VisColumn, VisFieldType } from '../types';
import { FilterConfig } from './table_vis_filter';
import type { TableSortConfig } from './table_vis_config';

// Function to calculate luminance of a hex color
export const getLuminance = (hexColor: string): number => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const linearize = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rL = linearize(r);
  const gL = linearize(g);
  const bL = linearize(b);

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
};

export const getTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // Use white text for dark backgrounds (luminance < 0.5), black for light backgrounds
  return luminance < 0.5 ? '#FFFFFF' : '#000000';
};

/** The text a table cell shows for a value. Data links carry the same text. */
export const cellValueText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

export const matchesFilter = (value: any, config: FilterConfig) => {
  const op = config.operator || FilterOperator.Contains;
  const hasValues = Array.isArray(config.values) && config.values.length > 0;
  const hasSearch = typeof config.search === 'string' && config.search.trim() !== '';
  const sVal = value === null ? '' : String(value);
  const sSearch = (config.search || '').trim();
  const toNum = (v: any) => (v === null || v === '' ? NaN : Number(v));

  if (op === FilterOperator.Contains) {
    return !hasSearch || sVal.toLowerCase().includes(sSearch.toLowerCase());
  }

  if (op === FilterOperator.Equals) {
    const matchValues = !hasValues || config.values.includes(value);
    return matchValues;
  }

  if (op === FilterOperator.Equal || op === FilterOperator.NotEqual) {
    if (hasValues) {
      const numValue = toNum(value);
      const numValues = config.values.map(toNum).filter((nv): nv is number => Number.isFinite(nv));
      const hit = numValues.includes(numValue);
      return op === FilterOperator.Equal ? hit : !hit;
    }
    if (hasSearch) {
      const numValue = toNum(value);
      const numSearch = toNum(sSearch);
      if (!Number.isFinite(numValue) || !Number.isFinite(numSearch)) return false;
      const eq = numValue === numSearch;
      return op === FilterOperator.Equal ? eq : !eq;
    }
    return true;
  }

  if (
    op === FilterOperator.GreaterThan ||
    op === FilterOperator.GreaterThanOrEqual ||
    op === FilterOperator.LessThan ||
    op === FilterOperator.LessThanOrEqual
  ) {
    const thresholdStr = hasSearch ? sSearch : hasValues ? String(config.values[0]) : '';
    const nVal = toNum(value);
    const nThr = toNum(thresholdStr);
    if (!Number.isFinite(nVal) || !Number.isFinite(nThr)) return false;

    switch (op) {
      case FilterOperator.GreaterThan:
        return nVal > nThr;
      case FilterOperator.GreaterThanOrEqual:
        return nVal >= nThr;
      case FilterOperator.LessThan:
        return nVal < nThr;
      case FilterOperator.LessThanOrEqual:
        return nVal <= nThr;
    }
  }

  return true;
};

export interface TableSortingColumn {
  /** Data grid column id (`VisColumn.column`). */
  id: string;
  direction: 'asc' | 'desc';
}

/**
 * Maps a saved sort (keyed by column name) to data grid sorting (keyed by column id).
 * Entries whose column is no longer present are dropped.
 */
export const toGridSorting = (
  sortColumns: TableSortConfig[] = [],
  columns: VisColumn[]
): TableSortingColumn[] =>
  sortColumns.flatMap(({ field, direction }) => {
    const col = columns.find((c) => c.name === field);
    return col ? [{ id: col.column, direction }] : [];
  });

const isEmptyValue = (value: unknown) => value === null || value === undefined || value === '';

const toSortableTime = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  return Date.parse(String(value));
};

/**
 * Ascending comparison of two non-empty cell values for a column of the given type.
 * Values that cannot be parsed as the column type fall back to string comparison.
 */
export const compareTableValues = (a: unknown, b: unknown, schema?: VisFieldType): number => {
  if (schema === VisFieldType.Numerical) {
    const nA = Number(a);
    const nB = Number(b);
    if (Number.isFinite(nA) && Number.isFinite(nB)) return nA - nB;
  } else if (schema === VisFieldType.Date) {
    const tA = toSortableTime(a);
    const tB = toSortableTime(b);
    if (Number.isFinite(tA) && Number.isFinite(tB)) return tA - tB;
  }
  return cellValueText(a).localeCompare(cellValueText(b), undefined, { numeric: true });
};

/**
 * Returns a new array sorted by the given columns in priority order.
 * Empty values (null / undefined / '') always sort last, regardless of direction.
 */
export const sortTableRows = <T extends Record<string, any>>(
  rows: T[],
  sorting: TableSortingColumn[],
  columnTypes: Record<string, VisFieldType>
): T[] => {
  if (sorting.length === 0) return rows;
  return [...rows].sort((rowA, rowB) => {
    for (const { id, direction } of sorting) {
      const a = rowA[id];
      const b = rowB[id];
      const emptyA = isEmptyValue(a);
      const emptyB = isEmptyValue(b);
      if (emptyA || emptyB) {
        if (emptyA && emptyB) continue;
        return emptyA ? 1 : -1;
      }
      const result = compareTableValues(a, b, columnTypes[id]);
      if (result !== 0) return direction === 'asc' ? result : -result;
    }
    return 0;
  });
};
