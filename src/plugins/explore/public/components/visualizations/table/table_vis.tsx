/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { EuiDataGrid, EuiDataGridCellValueElementProps, EuiDataGridColumn } from '@elastic/eui';
import { VisColumn } from '../types';
import { TableChartStyleControls } from './table_vis_config';
import { TableColumnHeader } from './table_vis_filter';

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

export const TableVis = React.memo(({ rows, columns, styleOptions }: TableVisProps) => {
  const pageSize = styleOptions?.pageSize ? styleOptions.pageSize : 10;
  const [visibleColumns, setVisibleColumns] = useState(() => columns.map(({ column }) => column));
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);

  const columnUniques = useMemo(() => {
    const uniques: Record<string, Set<any>> = {};
    columns.forEach((col) => (uniques[col.column] = new Set()));
    rows.forEach((row) => {
      columns.forEach((col) => {
        if (row.hasOwnProperty(col.column)) {
          uniques[col.column].add(row[col.column]);
        }
      });
    });
    return Object.fromEntries(
      Object.entries(uniques).map(([key, set]) => [key, Array.from(set).sort()])
    );
  }, [columns, rows]);

  const dataGridColumns: EuiDataGridColumn[] = useMemo(() => {
    return columns.map((col) => ({
      id: col.column,
      displayAsText: col.name,
      display: (
        <TableColumnHeader
          col={col}
          showColumnFilter={styleOptions?.showColumnFilter}
          popoverOpen={popoverOpen === col.column}
          setPopoverOpen={(open) => setPopoverOpen(open ? col.column : null)}
          filters={filters}
          setFilters={setFilters}
          uniques={columnUniques[col.column] || []}
        />
      ),
    }));
  }, [columns, styleOptions?.showColumnFilter, popoverOpen, filters, columnUniques, setFilters]);

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

  const matchesFilter = (value: any, config: FilterConfig) => {
    const op = config.operator || 'contains';
    const hasValues = Array.isArray(config.values) && config.values.length > 0;
    const hasSearch = typeof config.search === 'string' && config.search.trim() !== '';
    const strVal = (v: any) => (v == null ? '' : String(v));
    const sVal = strVal(value);
    const sSearch = (config.search || '').trim();
    const toNum = (v: any) => (v == null || v === '' ? NaN : Number(v));

    if (op === 'expression') {
      if (!hasSearch) return false;
      try {
        const expr = sSearch.replace(/\$/g, 'u');
        const fn = new Function('u', `return ${expr};`);
        return !!fn(value);
      } catch {
        return false;
      }
    }

    if (op === 'contains') {
      if (hasSearch) return sVal.toLowerCase().includes(sSearch.toLowerCase());
      if (hasValues) return config.values.includes(value);
      return true;
    }

    if (op === '=' || op === '!=') {
      if (hasValues) {
        const hit = config.values.includes(value);
        return op === '=' ? hit : !hit;
      }
      if (!hasSearch) return false;
      const eq = value === (isNaN(Number(sSearch)) ? sSearch : Number(sSearch));
      return op === '=' ? eq : !eq;
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

    return false;
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.entries(filters).every(([columnId, config]) => {
        const v = row[columnId];
        return matchesFilter(v, config);
      })
    );
  }, [rows, filters]);

  const normalizedFooterCalcs = useMemo(() => {
    const raw = styleOptions?.footerCalculations || [];
    return (raw as any[]).map((c) =>
      'fields' in c ? c : { fields: c.field ? [String(c.field)] : [], calculation: c.calculation }
    ) as Array<{ fields: string[]; calculation: 'total' | 'last' | 'average' | 'min' | 'max' }>;
  }, [styleOptions?.footerCalculations]);

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

        switch (calculation) {
          case 'total':
            footer[field] = values.reduce((sum, v) => sum + v, 0);
            break;
          case 'average':
            footer[field] = values.reduce((sum, v) => sum + v, 0) / values.length;
            break;
          case 'min':
            footer[field] = Math.min(...values);
            break;
          case 'max':
            footer[field] = Math.max(...values);
            break;
          case 'last':
            footer[field] = values[values.length - 1];
            break;
          default:
            footer[field] = '-';
        }
      });
    });
    return footer;
  }, [filteredRows, styleOptions?.showFooter, normalizedFooterCalcs]);

  const renderCellValue = useMemo(() => {
    return ({ rowIndex, columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
      const alignment = styleOptions?.globalAlignment || 'auto';
      setCellProps?.({ style: { textAlign: alignment === 'auto' ? 'left' : alignment } });
      return Object.prototype.hasOwnProperty.call(filteredRows, rowIndex)
        ? (filteredRows as any)[rowIndex][columnId]
        : null;
    };
  }, [filteredRows, styleOptions?.globalAlignment]);

  const renderFooterCellValue = useMemo(() => {
    if (!footerValues) return undefined;
    return ({ columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
      const alignment = styleOptions?.globalAlignment || 'auto';
      setCellProps?.({ style: { textAlign: alignment === 'auto' ? 'left' : alignment } });
      return footerValues[columnId] ?? '-';
    };
  }, [footerValues, styleOptions?.globalAlignment]);

  return (
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
  );
});
