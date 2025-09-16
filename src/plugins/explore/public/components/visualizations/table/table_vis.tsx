/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiDataGrid, EuiDataGridCellValueElementProps, EuiDataGridColumn } from '@elastic/eui';
import { VisColumn, VisFieldType } from '../types';
import {
  defaultTableChartStyles,
  CellTypeConfig,
  TableChartStyleControls,
} from './table_vis_config';
import { FilterConfig, TableColumnHeader } from './table_vis_filter';
import { calculateValue } from '../utils/calculation';
import { CellValue } from './cell_value';
import { getThresholdByValue } from '../utils/utils';
import { matchesFilter } from './table_vis_utils';

import './table_vis.scss';

interface TableVisProps {
  rows: Array<Record<string, any>>;
  columns: VisColumn[];
  styleOptions?: TableChartStyleControls;
  pageSizeOptions?: number[];
  showStyleSelector?: boolean;
}

export const TableVis = React.memo(
  ({ rows, columns, styleOptions, pageSizeOptions, showStyleSelector }: TableVisProps) => {
    const pageSize = styleOptions?.pageSize ?? defaultTableChartStyles.pageSize;
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

    const renderCellValue = useCallback(
      ({ rowIndex, columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
        const cellTypes: CellTypeConfig[] = styleOptions?.cellTypes || [];
        const columnCellType = cellTypes.find((ct) => ct.field === columnId)?.type || 'auto';
        const alignment = styleOptions?.globalAlignment || 'auto';
        const textAlign =
          alignment === 'auto'
            ? columnTypes[columnId] === 'numerical'
              ? 'right'
              : 'left'
            : alignment;
        const cellValue = Object.prototype.hasOwnProperty.call(filteredRows, rowIndex)
          ? filteredRows[rowIndex][columnId]
          : null;

        let color: string | undefined;
        if (
          columnCellType !== 'auto' &&
          styleOptions?.thresholds &&
          styleOptions.thresholds.length > 0
        ) {
          const threshold = getThresholdByValue(cellValue, styleOptions.thresholds);
          if (threshold) {
            color = threshold.color;
          } else {
            color = styleOptions.baseColor;
          }
        }

        return (
          <CellValue
            setCellProps={setCellProps}
            textAlign={textAlign}
            value={cellValue}
            colorMode={columnCellType}
            color={color}
          />
        );
      },
      [
        columnTypes,
        filteredRows,
        styleOptions?.thresholds,
        styleOptions?.baseColor,
        styleOptions?.cellTypes,
        styleOptions?.globalAlignment,
      ]
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

        let footerValue = '-';
        if (styleOptions?.showFooter && styleOptions?.footerCalculations) {
          const calcForColumn = styleOptions.footerCalculations.find(({ fields }) =>
            fields?.includes(columnId)
          );
          if (calcForColumn) {
            const values = filteredRows
              .map((row) => row[columnId])
              .filter((v) => typeof v === 'number' && !isNaN(v));
            if (values.length > 0) {
              const result = calculateValue(values, calcForColumn.calculation);
              if (result != null) {
                const label =
                  calcForColumn.calculation.charAt(0).toUpperCase() +
                  calcForColumn.calculation.slice(1);
                footerValue = `${label}: ${result}`;
              }
            }
          }
        }

        return <CellValue setCellProps={setCellProps} value={footerValue} textAlign={textAlign} />;
      },
      [
        columnTypes,
        filteredRows,
        styleOptions?.globalAlignment,
        styleOptions?.showFooter,
        styleOptions?.footerCalculations,
      ]
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
      <div className="tableVis">
        <EuiDataGrid
          key={`table-vis-${filteredRows.length}-${pagination.pageSize}`}
          className="tableVis__dataGrid"
          aria-label="Table visualization"
          columns={dataGridColumns}
          columnVisibility={{ visibleColumns, setVisibleColumns }}
          rowCount={filteredRows.length}
          pagination={{
            ...pagination,
            onChangePage,
            onChangeItemsPerPage,
            pageSizeOptions,
          }}
          renderCellValue={renderCellValue}
          renderFooterCellValue={styleOptions?.showFooter ? renderFooterCellValue : undefined}
          toolbarVisibility={{
            showFullScreenSelector: false,
            showStyleSelector: showStyleSelector ?? true,
          }}
          gridStyle={{ rowHover: 'highlight' }}
          leadingControlColumns={[]}
          trailingControlColumns={[]}
        />
      </div>
    );
  }
);
