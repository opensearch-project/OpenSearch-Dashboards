/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { EuiDataGrid, EuiDataGridCellValueElementProps, EuiDataGridColumn } from '@elastic/eui';
import { VisColumn } from '../types';
import { TableChartStyleControls } from './table_vis_config';

interface TableVisProps {
  rows: Array<Record<string, any>>;
  columns: VisColumn[];
  styleOptions?: TableChartStyleControls;
}

export const TableVis = React.memo(({ rows, columns, styleOptions }: TableVisProps) => {
  const pageSize = styleOptions?.pageSize ? styleOptions.pageSize : 10;
  const [visibleColumns, setVisibleColumns] = useState(() => columns.map(({ column }) => column));

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const dataGridColumns: EuiDataGridColumn[] = useMemo(() => {
    return columns.map((col) => ({ id: col.column, displayAsText: col.name }));
  }, [columns]);

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

  const renderCellValue = useMemo(() => {
    return ({ rowIndex, columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
      return rows.hasOwnProperty(rowIndex) ? rows[rowIndex][columnId] : null;
    };
  }, [rows]);

  return (
    <EuiDataGrid
      aria-label="Table visualization"
      columns={dataGridColumns}
      columnVisibility={{ visibleColumns, setVisibleColumns }}
      rowCount={rows.length}
      pagination={{ ...pagination, onChangePage, onChangeItemsPerPage, pageSize }}
      renderCellValue={renderCellValue}
      toolbarVisibility={{ showFullScreenSelector: false }}
    />
  );
});
