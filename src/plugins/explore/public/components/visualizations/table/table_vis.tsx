/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EuiDataGrid, EuiDataGridCellValueElementProps, EuiDataGridColumn } from '@elastic/eui';
import { VisColumn, VisFieldType } from '../types';
import { defaultTableChartStyles, CellTypeConfig, TableChartStyle } from './table_vis_config';
import { FilterConfig, TableColumnHeader } from './table_vis_filter';
import { calculateValue } from '../utils/calculation';
import { CellValue } from './cell_value';
import { getThresholdByValue } from '../utils/utils';
import { matchesFilter } from './table_vis_utils';

import './table_vis.scss';

interface TableVisProps {
  rows: Array<Record<string, any>>;
  columns: VisColumn[];
  styleOptions?: TableChartStyle;
  pageSizeOptions?: number[];
  showStyleSelector?: boolean;
  onStyleChange?: (updatedStyle: Partial<TableChartStyle>) => void;
  disableActions?: boolean;
}

export const TableVis = React.memo(
  ({
    rows,
    columns,
    styleOptions,
    pageSizeOptions,
    showStyleSelector,
    onStyleChange,
    disableActions,
  }: TableVisProps) => {
    const sortedColumns = useMemo(() => {
      const baseColumns = [...columns].sort((a, b) => a.id - b.id);

      // If user has a saved column order, use it
      if (styleOptions?.visibleColumns && styleOptions.visibleColumns.length > 0) {
        const userOrder = styleOptions.visibleColumns;
        const orderedColumns: VisColumn[] = [];

        // First, add columns in user-specified order
        userOrder.forEach((columnName) => {
          const foundColumn = baseColumns.find((col) => col.name === columnName);
          if (foundColumn) {
            orderedColumns.push(foundColumn);
          }
        });

        // Then add any new columns that weren't in the saved order
        baseColumns.forEach((col) => {
          if (!userOrder.includes(col.name)) {
            orderedColumns.push(col);
          }
        });

        return orderedColumns;
      }

      return baseColumns;
    }, [columns, styleOptions?.visibleColumns]);

    const [visibleColumns, setVisibleColumns] = useState(() =>
      sortedColumns.map(({ column }) => column)
    );

    // Update visibleColumns when sortedColumns changes, preserving user's visibility choices
    useEffect(() => {
      // Apply hiddenColumns from saved configuration if available
      const hiddenColumns = styleOptions?.hiddenColumns || [];
      const visibleColumnsFromConfig = sortedColumns.filter(
        (col) => !hiddenColumns.includes(col.name)
      );

      setVisibleColumns(visibleColumnsFromConfig.map((col) => col.column));
    }, [sortedColumns, styleOptions?.hiddenColumns]);

    // Handle user column order changes - directly save any reorder/hide operations
    const handleColumnVisibilityChange = useCallback(
      (updatedVisibleColumns: string[]) => {
        const previousVisibleColumns = visibleColumns;
        setVisibleColumns(updatedVisibleColumns);

        // Always save user changes when onStyleChange is available
        if (onStyleChange) {
          const allColumns = sortedColumns.map((col) => col.column);

          // Check if this is a reordering or visibility change
          const isReordering =
            updatedVisibleColumns.length === previousVisibleColumns.length &&
            updatedVisibleColumns.every((col) => previousVisibleColumns.includes(col));

          // Calculate hidden columns
          const newHiddenColumns = allColumns.filter((col) => !updatedVisibleColumns.includes(col));

          if (isReordering) {
            // This is a reordering operation - update column order
            const finalUserOrder: string[] = [];

            finalUserOrder.push(...updatedVisibleColumns);

            onStyleChange({
              visibleColumns: finalUserOrder
                .map((id) => sortedColumns.find((col) => col.column === id)?.name ?? '')
                .filter(Boolean),
            });
          } else {
            // This is a visibility change - save hidden columns and update order if needed
            const updates: Partial<TableChartStyle> = {
              hiddenColumns: newHiddenColumns
                .map((id) => sortedColumns.find((col) => col.column === id)?.name ?? '')
                .filter(Boolean),
            };

            onStyleChange(updates);
          }
        }
      },
      [onStyleChange, visibleColumns, sortedColumns]
    );

    const pageSize = styleOptions?.pageSize ?? defaultTableChartStyles.pageSize;
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
    const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
    const [popoverOpenColumnId, setPopoverOpenColumnId] = useState<string | null>(null);
    const [popoverOpenCell, setPopoverOpenCell] = useState<{
      rowIndex: number;
      columnId: string;
    } | null>(null);

    const columnUniques = useMemo(() => {
      const uniques: Record<string, Set<any>> = {};
      sortedColumns.forEach((col) => (uniques[col.column] = new Set()));
      rows.forEach((row) => {
        sortedColumns.forEach((col) => {
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
    }, [sortedColumns, rows]);

    const columnTypes = useMemo(() => {
      const types: Record<string, VisFieldType> = {};
      sortedColumns.forEach((col) => {
        types[col.column] = col.schema;
      });
      return types;
    }, [sortedColumns]);

    const dataGridColumns: EuiDataGridColumn[] = useMemo(() => {
      return sortedColumns.map((col) => ({
        id: col.column,
        displayAsText: col.name,
        actions: disableActions ? false : undefined,
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
      sortedColumns,
      styleOptions?.showColumnFilter,
      popoverOpenColumnId,
      filters,
      columnUniques,
      setFilters,
      disableActions,
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
        const alignment = styleOptions?.globalAlignment || 'left';
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
            dataLinks={styleOptions?.dataLinks}
            isPopoverOpen={
              popoverOpenCell?.rowIndex === rowIndex && popoverOpenCell?.columnId === columnId
            }
            setPopoverOpen={(open) => setPopoverOpenCell(open ? { rowIndex, columnId } : null)}
            columnId={columnId}
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
        styleOptions?.dataLinks,
        popoverOpenCell,
      ]
    );

    const renderFooterCellValue = useCallback(
      ({ columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
        const alignment = styleOptions?.globalAlignment || 'left';
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
          columnVisibility={{ visibleColumns, setVisibleColumns: handleColumnVisibilityChange }}
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
            showStyleSelector: disableActions ? false : showStyleSelector ?? true,
            showColumnSelector: disableActions ? false : true,
          }}
          gridStyle={{ rowHover: 'highlight' }}
          leadingControlColumns={[]}
          trailingControlColumns={[]}
        />
      </div>
    );
  }
);
