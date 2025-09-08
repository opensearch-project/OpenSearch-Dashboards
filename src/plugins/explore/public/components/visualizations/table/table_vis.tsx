/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiDataGrid, EuiDataGridCellValueElementProps, EuiDataGridColumn } from '@elastic/eui';
import { FilterOperator, VisColumn, VisFieldType } from '../types';
import { TableChartStyleControls } from './table_vis_config';
import { FilterConfig, TableColumnHeader } from './table_vis_filter';
import { calculateValue, CalculationMethod } from '../utils/calculation';
import { CellValue } from './cell_value';

interface TableVisProps {
  rows: Array<Record<string, any>>;
  columns: VisColumn[];
  styleOptions?: TableChartStyleControls;
}

interface Calc {
  fields: string[];
  calculation: CalculationMethod;
}

const matchesFilter = (value: any, config: FilterConfig) => {
  const op = config.operator || FilterOperator.Contains;
  const hasValues = Array.isArray(config.values) && config.values.length > 0;
  const hasSearch = typeof config.search === 'string' && config.search.trim() !== '';
  const sVal = value == null ? '' : String(value);
  const sSearch = (config.search || '').trim();
  const toNum = (v: any) => (v == null || v === '' ? NaN : Number(v));

  if (op === FilterOperator.Contains) {
    const matchSearch = !hasSearch || sVal.toLowerCase().includes(sSearch.toLowerCase());
    const matchValues = !hasValues || config.values.includes(value);
    return matchSearch && matchValues;
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

export const TableVis = React.memo(({ rows, columns, styleOptions }: TableVisProps) => {
  const pageSize = styleOptions?.pageSize ? styleOptions.pageSize : 10;
  const [visibleColumns, setVisibleColumns] = useState(() => columns.map(({ column }) => column));
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
  const [popoverOpenColumnId, setPopoverOpenColumnId] = useState<string | null>(null);

  const columnUniques = useMemo(() => {
    const uniques: Record<string, Set<any>> = {};
    columns.forEach((col) => (uniques[col.column] = new Set()));
    rows.forEach((row) => {
      columns.forEach((col) => {
        const value = row[col.column];
        if (row.hasOwnProperty(col.column) && value != null && value !== '') {
          uniques[col.column].add(row[col.column]);
        }
      });
    });
    return Object.fromEntries(
      Object.entries(uniques)
        .map(([key, set]) => [key, Array.from(set).sort()])
        .filter(([, arr]) => arr.length > 0)
    );
  }, [columns, rows]);

  const columnTypes = useMemo(() => {
    const types: Record<string, VisFieldType> = {};
    columns.forEach((col) => {
      types[col.column] = col.schema;
    });
    return types;
  }, [columns]);

  const dataGridColumns: EuiDataGridColumn[] = useMemo(() => {
    return columns.map((col) => ({
      id: col.column,
      displayAsText: col.name,
      display: (
        <TableColumnHeader
          col={col}
          showColumnFilter={styleOptions?.showColumnFilter}
          popoverOpen={popoverOpenColumnId === col.column}
          setPopoverOpen={(open) => setPopoverOpenColumnId(open ? col.column : null)}
          filters={filters}
          setFilters={setFilters}
          uniques={columnUniques[col.column] || []}
        />
      ),
    }));
  }, [
    columns,
    styleOptions?.showColumnFilter,
    popoverOpenColumnId,
    filters,
    columnUniques,
    setFilters,
  ]);

  const onChangeItemsPerPage = useCallback((newPageSize: number) => {
    setPagination((p) => ({
      ...p,
      pageSize: newPageSize,
      pageIndex: 0,
    }));
  }, []);

  useEffect(() => {
    if (!styleOptions?.showColumnFilter) {
      setFilters({});
    }
  }, [styleOptions?.showColumnFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.entries(filters).every(([columnId, config]) => {
        const v = row[columnId];
        return matchesFilter(v, config);
      })
    );
  }, [rows, filters]);

  useEffect(() => {
    setPagination({ pageIndex: 0, pageSize });
  }, [filteredRows.length, pageSize]);

  const availableFieldSet = useMemo(() => new Set(columns.map((c) => c.column)), [columns]);
  const normalizedFooterCalcs = useMemo<Calc[]>(() => {
    const raw = styleOptions?.footerCalculations ?? [];

    const processed: Calc[] = (raw as any[]).map(
      (c): Calc =>
        'fields' in c
          ? {
              fields: (c.fields ?? [])
                .filter((f: string | number | null | undefined): f is string | number => f != null)
                .map(String),
              calculation: c.calculation as CalculationMethod,
            }
          : {
              fields: c.field != null ? [String(c.field)] : [],
              calculation: c.calculation as CalculationMethod,
            }
    );

    return processed
      .map((c) => ({
        ...c,
        fields: c.fields.filter((f) => availableFieldSet.has(f)),
      }))
      .filter((c) => c.fields.length > 0);
  }, [styleOptions?.footerCalculations, availableFieldSet]);

  const footerValues = useMemo(() => {
    if (!styleOptions?.showFooter || !normalizedFooterCalcs.length) return undefined;

    const footer: Record<string, any> = {};

    const getNumericSeries = (field: string) =>
      filteredRows.map((row) => row[field]).filter((v) => typeof v === 'number' && !isNaN(v));

    normalizedFooterCalcs.forEach(({ fields, calculation }) => {
      fields.forEach((field) => {
        const values = getNumericSeries(field);
        if (values.length === 0) {
          footer[field] = '-';
          return;
        }

        const result = calculateValue(values, calculation);
        if (result == null) {
          footer[field] = '-';
        } else {
          const label = calculation.charAt(0).toUpperCase() + calculation.slice(1);
          footer[field] = `${label}: ${result}`;
        }
      });
    });
    return footer;
  }, [filteredRows, styleOptions?.showFooter, normalizedFooterCalcs]);

  const getCellColor = useCallback(
    (value: any, columnId: string): string | undefined => {
      if (columnTypes[columnId] !== 'numerical' || !styleOptions?.thresholds) return undefined;
      const numValue = Number(value);
      if (isNaN(numValue)) return undefined;

      const thresholds = [...styleOptions.thresholds].sort((a, b) => b.value - a.value);
      for (const threshold of thresholds) {
        if (numValue >= threshold.value) {
          return threshold.color;
        }
      }
      return styleOptions.baseColor || '#000000';
    },
    [columnTypes, styleOptions?.baseColor, styleOptions?.thresholds]
  );

  const renderCellValue = useCallback(
    ({ rowIndex, columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
      const alignment = styleOptions?.globalAlignment || 'auto';
      const textAlign =
        alignment === 'auto'
          ? columnTypes[columnId] === 'numerical'
            ? 'right'
            : 'left'
          : alignment;
      const cellValue = Object.prototype.hasOwnProperty.call(filteredRows, rowIndex)
        ? (filteredRows as any)[rowIndex][columnId]
        : null;
      return (
        <CellValue
          setCellProps={setCellProps}
          textAlign={textAlign}
          value={cellValue}
          colorMode={styleOptions?.cellType ?? 'auto'}
          color={getCellColor(cellValue, columnId)}
        />
      );
    },
    [columnTypes, filteredRows, getCellColor, styleOptions?.cellType, styleOptions?.globalAlignment]
  );

  const renderFooterCellValue = useCallback(
    ({ columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
      const alignment = styleOptions?.globalAlignment || 'auto';
      const textAlign =
        alignment === 'auto'
          ? columnTypes[columnId] === 'numerical'
            ? 'right'
            : 'left'
          : alignment;
      return (
        <CellValue
          setCellProps={setCellProps}
          value={footerValues?.[columnId] ?? '-'}
          textAlign={textAlign}
        />
      );
    },
    [columnTypes, footerValues, styleOptions?.globalAlignment]
  );

  const onChangePage = useCallback(
    (pageIndex: number) => {
      const maxPageIndex = Math.ceil(filteredRows.length / pagination.pageSize) - 1;
      const clampedPageIndex = Math.max(0, Math.min(pageIndex, maxPageIndex));
      setPagination((p) => ({ ...p, pageIndex: clampedPageIndex }));
    },
    [pagination.pageSize, filteredRows.length]
  );

  useEffect(() => {
    if (!styleOptions?.showColumnFilter) {
      setFilters({});
      setPopoverOpenColumnId(null);
      setPagination({ pageIndex: 0, pageSize });
    }
  }, [styleOptions?.showColumnFilter, pageSize]);

  return (
    <div className="table-visualization">
      <EuiDataGrid
        key={`table-vis-${filteredRows.length}-${pagination.pageSize}`}
        aria-label="Table visualization"
        columns={dataGridColumns}
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        rowCount={filteredRows.length}
        pagination={{ ...pagination, onChangePage, onChangeItemsPerPage }}
        renderCellValue={renderCellValue}
        renderFooterCellValue={styleOptions?.showFooter ? renderFooterCellValue : undefined}
        toolbarVisibility={{ showFullScreenSelector: false }}
        gridStyle={{ rowHover: 'highlight' }}
        leadingControlColumns={[]}
        trailingControlColumns={[]}
      />
    </div>
  );
});
