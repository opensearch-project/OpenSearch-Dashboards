/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiDataGrid, EuiDataGridCellValueElementProps, EuiDataGridColumn } from '@elastic/eui';
import { VisColumn, VisFieldType } from '../types';
import { TableChartStyleControls } from './table_vis_config';
import { TableColumnHeader } from './table_vis_filter';
import { getTextColor } from '../utils/utils';
import { calculateValue, CalculationMethod } from '../utils/calculation';

interface TableVisProps {
  rows: Array<Record<string, any>>;
  columns: VisColumn[];
  styleOptions?: TableChartStyleControls;
}

interface FilterConfig {
  values: any[];
  operator: string;
  search?: string;
}

interface Calc {
  fields: string[];
  calculation: CalculationMethod;
}

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
      isExpandable: false,
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

  const onChangePage = useCallback((pageIndex) => setPagination((p) => ({ ...p, pageIndex })), [
    setPagination,
  ]);

  const onChangeItemsPerPage = useCallback(
    (perPage) =>
      setPagination((p) => ({
        ...p,
        pageSize: perPage,
        pageIndex: 0,
      })),
    [setPagination]
  );

  useEffect(() => {
    if (!styleOptions?.showColumnFilter) {
      setFilters({});
    }
  }, [styleOptions?.showColumnFilter]);

  const matchesFilter = (value: any, config: FilterConfig) => {
    const op = config.operator || 'contains';
    const hasValues = Array.isArray(config.values) && config.values.length > 0;
    const hasSearch = typeof config.search === 'string' && config.search.trim() !== '';
    const sVal = value == null ? '' : String(value);
    const sSearch = (config.search || '').trim();
    const toNum = (v: any) => (v == null || v === '' ? NaN : Number(v));

    if (op === 'contains') {
      const matchSearch = !hasSearch || sVal.toLowerCase().includes(sSearch.toLowerCase());
      const matchValues = !hasValues || config.values.includes(value);
      return matchSearch && matchValues;
    }

    if (op === '=' || op === '!=') {
      if (hasValues) {
        const hit = config.values.includes(value);
        return op === '=' ? hit : !hit;
      }
      if (hasSearch) {
        const eq = value === Number(sSearch);
        return op === '=' ? eq : !eq;
      }
      return true;
    }

    if (op === '>' || op === '>=' || op === '<' || op === '<=') {
      const thresholdStr = hasSearch ? sSearch : hasValues ? String(config.values[0]) : '';
      const nVal = toNum(value);
      const nThr = toNum(thresholdStr);
      if (!Number.isFinite(nVal) || !Number.isFinite(nThr)) return false;

      switch (op) {
        case '>':
          return nVal > nThr;
        case '>=':
          return nVal >= nThr;
        case '<':
          return nVal < nThr;
        case '<=':
          return nVal <= nThr;
      }
    }

    return true;
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.entries(filters).every(([columnId, config]) => {
        const v = row[columnId];
        return matchesFilter(v, config);
      })
    );
  }, [rows, filters]);

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

  const getCellColor = (value: any, columnId: string): string | undefined => {
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
  };

  const CellValueRenderer: React.FC<EuiDataGridCellValueElementProps> = ({
    rowIndex,
    columnId,
    setCellProps,
  }) => {
    const alignment = styleOptions?.globalAlignment || 'auto';
    const textAlign =
      alignment === 'auto' ? (columnTypes[columnId] === 'numerical' ? 'right' : 'left') : alignment;
    const cellValue = Object.prototype.hasOwnProperty.call(filteredRows, rowIndex)
      ? (filteredRows as any)[rowIndex][columnId]
      : null;
    const { cellType, thresholds, baseColor } = styleOptions ?? {};

    useEffect(() => {
      const cellStyle: React.CSSProperties = { textAlign };

      if (cellType !== 'auto') {
        const color = getCellColor(cellValue, columnId);
        if (color) {
          if (cellType === 'colored_text') {
            cellStyle.color = color;
          } else if (cellType === 'colored_background') {
            cellStyle.backgroundColor = color;
            cellStyle.color = getTextColor(color);
          }
        }
      }

      setCellProps?.({
        style: cellStyle,
      });
    }, [setCellProps, cellValue, columnId, textAlign, cellType, thresholds, baseColor]);

    return cellValue;
  };

  const renderCellValue = CellValueRenderer;

  const renderFooterCellValue = useMemo(() => {
    if (!footerValues) return undefined;
    return ({ columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
      const alignment = styleOptions?.globalAlignment || 'auto';
      const textAlign =
        alignment === 'auto'
          ? columnTypes[columnId] === 'numerical'
            ? 'right'
            : 'left'
          : alignment;
      setCellProps?.({ style: { textAlign } });
      return footerValues[columnId] ?? '-';
    };
  }, [footerValues, styleOptions?.globalAlignment, columnTypes]);

  return (
    <div className="table-visualization">
      <EuiDataGrid
        aria-label="Table visualization"
        columns={dataGridColumns}
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        rowCount={filteredRows.length}
        pagination={{ ...pagination, onChangePage, onChangeItemsPerPage, pageSize }}
        renderCellValue={renderCellValue}
        renderFooterCellValue={renderFooterCellValue}
        toolbarVisibility={{ showFullScreenSelector: false }}
        gridStyle={{ rowHover: 'highlight' }}
        leadingControlColumns={[]}
        trailingControlColumns={[]}
      />
    </div>
  );
});
