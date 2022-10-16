/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { orderBy } from 'lodash';
import { EuiDataGridProps, EuiDataGrid, EuiDataGridSorting, EuiTitle } from '@elastic/eui';

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

  const sortedRows = useMemo(() => {
    const sort = handlers.uiState.get('vis.sortColumn');
    return sort && sort.colIndex !== null && sort.direction
      ? orderBy(rows, columns[sort.colIndex]?.id, sort.direction)
      : rows;
  }, [columns, rows, handlers.uiState]);

  const renderCellValue = useMemo(() => {
    return (({ rowIndex, columnId }) => {
      const rawContent = sortedRows[rowIndex][columnId];
      const colIndex = columns.findIndex((col) => col.id === columnId);
      const column = columns[colIndex];
      // use formatter to format raw content
      // this can format date and percentage data
      const formattedContent = column.formatter.convert(rawContent, 'text');
      return sortedRows.hasOwnProperty(rowIndex) ? formattedContent || null : null;
    }) as EuiDataGridProps['renderCellValue'];
  }, [sortedRows, columns]);

  const dataGridColumns = getDataGridColumns(
    sortedRows,
    columns,
    table,
    handlers,
    handlers.uiState.get('vis.columnsWidth') || []
  );

  const sortedColumns = useMemo(() => {
    const sort: SortColumn = handlers.uiState.get('vis.sortColumn') || {};
    return sort && sort.colIndex !== null && sort.direction
      ? [{ id: dataGridColumns[sort.colIndex]?.id, direction: sort.direction }]
      : [];
  }, [handlers.uiState, dataGridColumns]);

  const onSort = useCallback(
    (sortingCols: EuiDataGridSorting['columns'] | []) => {
      const nextSortValue = sortingCols[sortingCols.length - 1];
      const nextSort =
        sortingCols.length > 0
          ? {
              colIndex: dataGridColumns.findIndex((col) => col.id === nextSortValue?.id),
              direction: nextSortValue.direction,
            }
          : [];
      handlers.uiState.set('vis.sortColumn', nextSort);
      handlers.uiState.emit('reload');
      return nextSort;
    },
    [dataGridColumns, handlers.uiState]
  );

  const onColumnResize: EuiDataGridProps['onColumnResize'] = useCallback(
    ({ columnId, width }) => {
      const curState: ColumnWidth[] = handlers.uiState.get('vis.columnsWidth') || [];
      const nextState = [...curState];
      const nextColIndex = columns.findIndex((col) => col.id === columnId);
      const curColIndex = curState.findIndex((col) => col.colIndex === nextColIndex);
      const nextColWidth = { colIndex: nextColIndex, width };

      // if updated column index is not found, then add it to nextState
      // else reset it in nextState
      if (curColIndex < 0) nextState.push(nextColWidth);
      else nextState[curColIndex] = nextColWidth;

      // update uiState
      handlers.uiState.set('vis.columnsWidth', nextState);
      handlers.uiState.emit('reload');
    },
    [columns, handlers.uiState]
  );

  const ariaLabel = title || visConfig.title || 'tableVis';

  const footerCellValue = visConfig.showTotal
    ? // @ts-expect-error
      ({ columnId }) => {
        const colIndex = columns.findIndex((col) => col.id === columnId);
        return columns[colIndex]?.formattedTotal || null;
      }
    : undefined;

  return (
    <>
      {title && (
        <EuiTitle size="xs">
          <h3>{title}</h3>
        </EuiTitle>
      )}
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
        gridStyle={{
          border: 'horizontal',
          header: 'underline',
        }}
        minSizeForControls={1}
        renderFooterCellValue={footerCellValue}
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
    </>
  );
};
