/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { orderBy } from 'lodash';
import dompurify from 'dompurify';
import { EuiDataGridProps, EuiDataGrid, EuiDataGridSorting, EuiTitle } from '@elastic/eui';

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { Table } from '../table_vis_response_handler';
import { TableVisConfig, ColumnWidth, ColumnSort, TableUiState } from '../types';
import { getDataGridColumns } from './table_vis_grid_columns';
import { usePagination } from '../utils';
import { convertToFormattedData } from '../utils/convert_to_formatted_data';
import { TableVisControl } from './table_vis_control';

interface TableVisComponentProps {
  title?: string;
  table: Table;
  visConfig: TableVisConfig;
  event: IInterpreterRenderHandlers['event'];
  uiState: TableUiState;
}

export const TableVisComponent = ({
  title,
  table,
  visConfig,
  event,
  uiState,
}: TableVisComponentProps) => {
  const { formattedRows: rows, formattedColumns: columns } = convertToFormattedData(
    table,
    visConfig
  );

  const pagination = usePagination(visConfig, rows.length);

  const sortedRows = useMemo(() => {
    return uiState.sort.colIndex !== null &&
      columns[uiState.sort.colIndex].id &&
      uiState.sort.direction
      ? orderBy(rows, columns[uiState.sort.colIndex].id, uiState.sort.direction)
      : rows;
  }, [columns, rows, uiState]);

  const renderCellValue = useMemo(() => {
    return (({ rowIndex, columnId }) => {
      const rawContent = sortedRows[rowIndex][columnId];
      const colIndex = columns.findIndex((col) => col.id === columnId);
      const htmlContent = columns[colIndex].formatter.convert(rawContent, 'html');
      const formattedContent = (
        /*
         * Justification for dangerouslySetInnerHTML:
         * This is one of the visualizations which makes use of the HTML field formatters.
         * Since these formatters produce raw HTML, this visualization needs to be able to render them as-is, relying
         * on the field formatter to only produce safe HTML.
         * `htmlContent` is created by converting raw data via HTML field formatter, so we need to make sure this value never contains
         * any unsafe HTML (e.g. by bypassing the field formatter).
         */
        <div dangerouslySetInnerHTML={{ __html: dompurify.sanitize(htmlContent) }} /> // eslint-disable-line react/no-danger
      );
      return sortedRows.hasOwnProperty(rowIndex) ? formattedContent || null : null;
    }) as EuiDataGridProps['renderCellValue'];
  }, [sortedRows, columns]);

  const dataGridColumns = getDataGridColumns(sortedRows, columns, table, event, uiState.width);

  const sortedColumns = useMemo(() => {
    return uiState.sort.colIndex !== null &&
      dataGridColumns[uiState.sort.colIndex].id &&
      uiState.sort.direction
      ? [{ id: dataGridColumns[uiState.sort.colIndex].id, direction: uiState.sort.direction }]
      : [];
  }, [dataGridColumns, uiState]);

  const onSort = useCallback(
    (sortingCols: EuiDataGridSorting['columns'] | []) => {
      const nextSortValue = sortingCols[sortingCols.length - 1];
      const nextSort: ColumnSort =
        sortingCols.length > 0
          ? {
              colIndex: dataGridColumns.findIndex((col) => col.id === nextSortValue?.id),
              direction: nextSortValue.direction,
            }
          : {
              colIndex: null,
              direction: null,
            };
      uiState.setSort(nextSort);
      return nextSort;
    },
    [dataGridColumns, uiState]
  );

  const onColumnResize: EuiDataGridProps['onColumnResize'] = useCallback(
    ({ columnId, width }) => {
      const curWidth: ColumnWidth[] = uiState.width;
      const nextWidth = [...curWidth];
      const nextColIndex = columns.findIndex((col) => col.id === columnId);
      const curColIndex = curWidth.findIndex((col) => col.colIndex === nextColIndex);
      const nextColWidth = { colIndex: nextColIndex, width };

      // if updated column index is not found, then add it to nextWidth
      // else reset it in nextWidth
      if (curColIndex < 0) nextWidth.push(nextColWidth);
      else nextWidth[curColIndex] = nextColWidth;

      // update uiState.width
      uiState.setWidth(nextWidth);
    },
    [columns, uiState]
  );

  const ariaLabel = title || visConfig.title || 'tableVis';

  const footerCellValue = visConfig.showTotal
    ? ({ columnId }: { columnId: any }) => {
        return columns.find((col) => col.id === columnId)?.formattedTotal || null;
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
