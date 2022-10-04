/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { isEqual } from 'lodash';
import { EuiDataGridProps, EuiDataGrid } from '@elastic/eui';

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { Table } from '../table_vis_response_handler';
import { TableVisConfig, ColumnWidth } from '../types';
import { getDataGridColumns } from './table_vis_grid_columns';
import { usePagination } from '../utils';

interface TableVisComponentProps {
  table: Table;
  visConfig: TableVisConfig;
  handlers: IInterpreterRenderHandlers;
}

export const TableVisComponent = ({ table, visConfig, handlers }: TableVisComponentProps) => {
  const { rows, columns } = table;

  const pagination = usePagination(visConfig, rows.length);

  // toDo: it is a sample renderCellValue to render a data grid component
  // will check on it and it might be replaced
  const renderCellValue = useMemo(() => {
    return (({ rowIndex, columnId }) => {
      let adjustedRowIndex = rowIndex;

      // If we are doing the pagination (instead of leaving that to the grid)
      // then the row index must be adjusted as `data` has already been pruned to the page size
      adjustedRowIndex = rowIndex - pagination!.pageIndex * pagination!.pageSize;

      return rows.hasOwnProperty(adjustedRowIndex)
        ? rows[adjustedRowIndex][columnId] || null
        : null;
    }) as EuiDataGridProps['renderCellValue'];
  }, [rows, pagination]);

  // resize column
  const [columnsWidth, setColumnsWidth] = useState<ColumnWidth[]>(
    handlers.uiState.get('vis.columnsWidth') || []
  );
  const curColumnsWidth = useRef<{
    columnsWidth: ColumnWidth[];
  }>({
    columnsWidth: handlers.uiState?.get('vis.columnsWidth'),
  });

  const onColumnResize: EuiDataGridProps['onColumnResize'] = useCallback(
    ({ columnId, width }) => {
      setColumnsWidth((prevState) => {
        const nextColIndex = columns.findIndex((c) => c.id === columnId);
        const prevColIndex = prevState.findIndex((c) => c.colIndex === nextColIndex);
        const nextState = [...prevState];
        const updatedColWidth = { colIndex: nextColIndex, width };

        // if updated column index is not found, then add it to nextState
        // else reset it in nextState
        if (prevColIndex < 0) nextState.push(updatedColWidth);
        else nextState[prevColIndex] = updatedColWidth;

        // update uiState
        handlers.uiState?.set('vis.columnsWidth', nextState);
        return nextState;
      });
    },
    [columns, setColumnsWidth, handlers.uiState]
  );

  useEffect(() => {
    const updateTable = () => {
      const updatedVisState = handlers.uiState?.getChanges()?.vis;
      if (!isEqual(updatedVisState?.columnsWidth, curColumnsWidth.current.columnsWidth)) {
        curColumnsWidth.current.columnsWidth = updatedVisState?.columnsWidth;
        setColumnsWidth(updatedVisState?.columnsWidth || []);
      }
    };

    if (handlers.uiState) {
      handlers.uiState.on('change', updateTable);
    }

    return () => {
      handlers.uiState?.off('change', updateTable);
    };
  }, [handlers.uiState]);

  const dataGridColumns = getDataGridColumns(table, visConfig, handlers, columnsWidth);

  return (
    <EuiDataGrid
      aria-label="tableVis"
      columns={dataGridColumns}
      columnVisibility={{
        visibleColumns: columns.map(({ id }) => id),
        setVisibleColumns: () => {},
      }}
      rowCount={rows.length}
      renderCellValue={renderCellValue}
      onColumnResize={onColumnResize}
      pagination={pagination}
    />
  );
};
