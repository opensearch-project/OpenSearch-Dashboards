/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiDataGridColumn, EuiDataGridColumnCellActionProps } from '@elastic/eui';
import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { OpenSearchDashboardsDatatableRow } from 'src/plugins/expressions';
import { Table } from '../table_vis_response_handler';
import { ColumnWidth, FormattedColumn } from '../types';

export const getDataGridColumns = (
  rows: OpenSearchDashboardsDatatableRow[],
  cols: FormattedColumn[],
  table: Table,
  event: IInterpreterRenderHandlers['event'],
  columnWidths: ColumnWidth[]
) => {
  const filterBucket = (rowIndex: number, columnIndex: number, negate: boolean) => {
    const foramttedColumnId = cols[columnIndex].id;
    const rawColumnIndex = table.columns.findIndex((col) => col.id === foramttedColumnId);
    event({
      name: 'filterBucket',
      data: {
        data: [
          {
            table: {
              columns: table.columns,
              rows,
            },
            row: rowIndex,
            column: rawColumnIndex,
          },
        ],
        negate,
      },
    });
  };

  return cols.map((col, colIndex) => {
    const cellActions = col.filterable
      ? [
          ({ rowIndex, columnId, Component, closePopover }: EuiDataGridColumnCellActionProps) => {
            const filterValue = rows[rowIndex][columnId];
            const filterContent = col.formatter?.convert(filterValue);

            const filterForValueText = i18n.translate(
              'visTypeTable.tableVisFilter.filterForValue',
              {
                defaultMessage: 'Filter for value',
              }
            );
            const filterForValueLabel = i18n.translate(
              'visTypeTable.tableVisFilter.filterForValueLabel',
              {
                defaultMessage: 'Filter for value: {filterContent}',
                values: {
                  filterContent,
                },
              }
            );

            return (
              filterValue != null && (
                <Component
                  onClick={() => {
                    filterBucket(rowIndex, colIndex, false);
                    closePopover();
                  }}
                  iconType="plusInCircle"
                  aria-label={filterForValueLabel}
                  data-test-subj="filterForValue"
                >
                  {filterForValueText}
                </Component>
              )
            );
          },
          ({ rowIndex, columnId, Component, closePopover }: EuiDataGridColumnCellActionProps) => {
            const filterValue = rows[rowIndex][columnId];
            const filterContent = col.formatter?.convert(filterValue);

            const filterOutValueText = i18n.translate(
              'visTypeTable.tableVisFilter.filterOutValue',
              {
                defaultMessage: 'Filter out value',
              }
            );
            const filterOutValueLabel = i18n.translate(
              'visTypeTable.tableVisFilter.filterOutValueLabel',
              {
                defaultMessage: 'Filter out value: {filterContent}',
                values: {
                  filterContent,
                },
              }
            );

            return (
              filterValue != null && (
                <Component
                  onClick={() => {
                    filterBucket(rowIndex, colIndex, true);
                    closePopover();
                  }}
                  iconType="minusInCircle"
                  aria-label={filterOutValueLabel}
                  data-test-subj="filterOutValue"
                >
                  {filterOutValueText}
                </Component>
              )
            );
          },
        ]
      : undefined;

    const initialWidth = columnWidths.find((c) => c.colIndex === colIndex);

    const dataGridColumn: EuiDataGridColumn = {
      id: col.id,
      display: col.title,
      displayAsText: col.title,
      actions: {
        showHide: false,
        showMoveLeft: false,
        showMoveRight: false,
        showSortAsc: {
          label: i18n.translate('visTypeTable.tableVisSort.ascSortLabel', {
            defaultMessage: 'Sort asc',
          }),
        },
        showSortDesc: {
          label: i18n.translate('visTypeTable.tableVisSort.descSortLabel', {
            defaultMessage: 'Sort desc',
          }),
        },
      },
      cellActions,
    };
    if (initialWidth) {
      dataGridColumn.initialWidth = initialWidth.width;
    }
    return dataGridColumn;
  });
};
