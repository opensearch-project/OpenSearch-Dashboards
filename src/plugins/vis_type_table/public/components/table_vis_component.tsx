/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { orderBy } from 'lodash';
import {
  EuiDataGridProps,
  EuiDataGrid,
  EuiDataGridSorting,
  EuiTitle,
  EuiFlexItem,
} from '@elastic/eui';

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { FormattedTableContext } from '../table_vis_response_handler';
import { TableVisConfig, ColumnSort } from '../types';
import { getDataGridColumns } from './table_vis_grid_columns';
import { getTableVisCellValue } from './table_vis_cell';
import { usePagination } from '../utils';
import { TableVisControl } from './table_vis_control';
import { TableUiState } from '../utils';

interface TableVisComponentProps {
  title?: string;
  table: FormattedTableContext;
  visConfig: TableVisConfig;
  event: IInterpreterRenderHandlers['event'];
  uiState: TableUiState;
}

export const TableVisComponent = ({
  title,
  table,
  visConfig,
  event,
  uiState: { sort, setSort, colWidth, setWidth },
}: TableVisComponentProps) => {
  const { rows, columns, formattedColumns } = table;

  const pagination = usePagination(visConfig, rows.length);

  const sortedRows = useMemo(() => {
    const sortColumnId =
      sort.colIndex !== null && sort.colIndex !== undefined
        ? formattedColumns[sort.colIndex]?.id
        : undefined;

    if (sortColumnId && sort.direction) {
      return orderBy(rows, sortColumnId, sort.direction);
    } else {
      return rows;
    }
  }, [formattedColumns, rows, sort]);

  const renderCellValue = useMemo(() => getTableVisCellValue(sortedRows, formattedColumns), [
    sortedRows,
    formattedColumns,
  ]);

  const sortedTable = useMemo(() => {
    return {
      rows: sortedRows,
      columns,
      formattedColumns,
    };
  }, [sortedRows, columns, formattedColumns]);

  const dataGridColumns = getDataGridColumns(sortedTable, event, colWidth);

  const sortedColumns = useMemo(() => {
    if (
      sort.colIndex !== null &&
      sort.colIndex !== undefined &&
      dataGridColumns[sort.colIndex].id &&
      sort.direction
    ) {
      return [{ id: dataGridColumns[sort.colIndex].id, direction: sort.direction }];
    } else {
      return [];
    }
  }, [dataGridColumns, sort]);

  const onSort = useCallback(
    (sortingCols: EuiDataGridSorting['columns'] | []) => {
      const nextSortValue = sortingCols[sortingCols.length - 1];
      const nextSort: ColumnSort =
        sortingCols.length > 0
          ? {
              colIndex: dataGridColumns.findIndex((col) => col.id === nextSortValue?.id),
              direction: nextSortValue.direction,
            }
          : [];
      setSort(nextSort);
      return nextSort;
    },
    [dataGridColumns, setSort]
  );

  const onColumnResize: EuiDataGridProps['onColumnResize'] = useCallback(
    ({ columnId, width }: { columnId: string; width: number }) => {
      const colIndex = formattedColumns.findIndex((col) => col.id === columnId);
      // update width in uiState
      setWidth({ colIndex, width });
    },
    [formattedColumns, setWidth]
  );

  const ariaLabel = title || visConfig.title || 'tableVis';

  const footerCellValue = visConfig.showTotal
    ? ({ columnId }: { columnId: any }) => {
        return formattedColumns.find((col) => col.id === columnId)?.formattedTotal || null;
      }
    : undefined;

  return (
    <EuiFlexItem>
      {title && (
        <EuiTitle size="xs" className="eui-textCenter">
          <h3>{title}</h3>
        </EuiTitle>
      )}
      <EuiDataGrid
        aria-label={ariaLabel}
        columns={dataGridColumns}
        columnVisibility={{
          visibleColumns: formattedColumns.map(({ id }) => id),
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
            <TableVisControl
              filename={visConfig.title}
              rows={sortedRows}
              columns={formattedColumns}
            />
          ),
        }}
      />
    </EuiFlexItem>
  );
};
