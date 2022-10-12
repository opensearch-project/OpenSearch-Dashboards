/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { isEqual, orderBy } from 'lodash';
import { EuiDataGridProps, EuiDataGrid, EuiDataGridSorting } from '@elastic/eui';

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { Table } from '../table_vis_response_handler';
import { TableVisConfig, ColumnWidth, SortColumn } from '../types';
import { getDataGridColumns } from './table_vis_grid_columns';
import { usePagination } from '../utils';
import { convertToFormattedData } from '../utils/convert_to_formatted_data';
import { TableVisControl } from './table_vis_control';

interface TableVisComponentProps {
  title?: string;
  table: Table;
  visConfig: TableVisConfig;
  handlers: IInterpreterRenderHandlers;
}

export const TableVisComponent = ({
  title,
  table,
  visConfig,
  handlers,
}: TableVisComponentProps) => {
  const { formattedRows: rows, formattedColumns: columns } = convertToFormattedData(
    table,
    visConfig
  );

  const pagination = usePagination(visConfig, rows.length);

  // store current state
  const currentColState = useRef<{
    columnsWidth: ColumnWidth[];
  }>({
    columnsWidth: handlers.uiState.get('vis.columnsWidth') || [],
  });

  const sortedRows = useMemo(() => {
    const sort = handlers.uiState.get('vis.sortColumn');
    return sort && sort.colIndex !== null && sort.direction
      ? orderBy(rows, columns[sort.colIndex]?.id, sort.direction)
      : rows;
  }, [columns, rows, handlers.uiState]);

  const renderCellValue = useMemo(() => {
    return (({ rowIndex, columnId }) => {
      return sortedRows.hasOwnProperty(rowIndex) ? sortedRows[rowIndex][columnId] || null : null;
    }) as EuiDataGridProps['renderCellValue'];
  }, [sortedRows]);

  const dataGridColumns = getDataGridColumns(
    sortedRows,
    columns,
    table,
    handlers,
    currentColState.current.columnsWidth
  );

  const sortedColumns = useMemo(() => {
    const sort = handlers.uiState.get('vis.sortColumn');
    return sort && sort.colIndex !== null && sort.direction
      ? [{ id: dataGridColumns[sort.colIndex]?.id, direction: sort.direction }]
      : [];
  }, [handlers.uiState, dataGridColumns]);

  const onSort = useCallback(
    (sortingCols: EuiDataGridSorting['columns']) => {
      const nextSortValue = sortingCols[sortingCols.length - 1];
      const nextSort = {
        colIndex: dataGridColumns.findIndex((col) => col.id === nextSortValue?.id),
        direction: nextSortValue.direction,
      };
      handlers.uiState.set('vis.sortColumn', nextSort);
      handlers.uiState?.emit('reload');
      return nextSort;
    },
    [dataGridColumns, handlers.uiState]
  );

  const onColumnResize: EuiDataGridProps['onColumnResize'] = useCallback(
    ({ columnId, width }) => {
      const prevState: ColumnWidth[] = currentColState.current.columnsWidth;
      const nextColIndex = columns.findIndex((col) => col.id === columnId);
      const prevColIndex = prevState.findIndex((col) => col.colIndex === nextColIndex);
      const nextState = [...prevState];
      const updatedColWidth = { colIndex: nextColIndex, width };

      // if updated column index is not found, then add it to nextState
      // else reset it in nextState
      if (prevColIndex < 0) nextState.push(updatedColWidth);
      else nextState[prevColIndex] = updatedColWidth;

      // update uiState
      currentColState.current.columnsWidth = nextState;
      handlers.uiState.set('vis.columnsWidth', nextState);
    },
    [columns, currentColState, handlers.uiState]
  );

  const ariaLabel = title || visConfig.title || 'tableVis';

  return (
    <EuiDataGrid
      aria-label={ariaLabel}
      columns={dataGridColumns}
      columnVisibility={{
        visibleColumns: columns.map(({ id }) => id),
        setVisibleColumns: () => {},
      }}
      rowCount={rows.length}
      renderCellValue={renderCellValue}
      sorting={{ columns: sortedColumns, onSort }}
      onColumnResize={onColumnResize}
      pagination={pagination}
      toolbarVisibility={{
        showColumnSelector: false,
        showSortSelector: false,
        showFullScreenSelector: false,
        showStyleSelector: false,
        additionalControls: (
          <TableVisControl filename={visConfig.title} rows={sortedRows} columns={columns} />
        ),
      }}
    />
  );
};
