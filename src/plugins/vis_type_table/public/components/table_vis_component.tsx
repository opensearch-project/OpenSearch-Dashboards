/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { EuiDataGridProps, EuiDataGrid } from '@elastic/eui';

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { Table } from '../table_vis_response_handler';
import { TableVisConfig } from '../types';
import { getDataGridColumns } from './table_vis_grid_columns';

interface TableVisComponentProps {
  table: Table;
  visConfig: TableVisConfig;
  handlers: IInterpreterRenderHandlers;
}

export const TableVisComponent = ({ table, visConfig, handlers }: TableVisComponentProps) => {
  const { rows, columns } = table;
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const onChangeItemsPerPage = useCallback(
    (pageSize) => setPagination((p) => ({ ...p, pageSize, pageIndex: 0 })),
    [setPagination]
  );

  const onChangePage = useCallback((pageIndex) => setPagination((p) => ({ ...p, pageIndex })), [
    setPagination,
  ]);

  // toDo: it is a sample renderCellValue to render a data grid component
  // will check on it and it might be replaced
  const renderCellValue = useMemo(() => {
    return (({ rowIndex, columnId }) => {
      let adjustedRowIndex = rowIndex;

      // If we are doing the pagination (instead of leaving that to the grid)
      // then the row index must be adjusted as `data` has already been pruned to the page size
      adjustedRowIndex = rowIndex - pagination.pageIndex * pagination.pageSize;

      return rows.hasOwnProperty(adjustedRowIndex)
        ? rows[adjustedRowIndex][columnId] || null
        : null;
    }) as EuiDataGridProps['renderCellValue'];
  }, [rows, pagination.pageIndex, pagination.pageSize]);

  const dataGridColumns = getDataGridColumns(table, visConfig, handlers);
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
      pagination={{
        ...pagination,
        onChangeItemsPerPage,
        onChangePage,
      }}
    />
  );
};
