/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { EuiDataGrid, EuiDataGridSorting, EuiPanel } from '@elastic/eui';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { fetchTableDataCell } from './data_grid_table_cell_value';
import { buildDataGridColumns, computeVisibleColumns } from './data_grid_table_columns';
import { DocViewExpandButton } from './data_grid_table_docview_expand_button';
import { DataGridFlyout } from './data_grid_table_flyout';
import { DiscoverGridContextProvider } from './data_grid_table_context';
import { toolbarVisibility } from './constants';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';
import { DiscoverServices } from '../../../build_services';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { usePagination } from '../utils/use_pagination';
import { SortOrder } from '../../../saved_searches/types';

export interface DataGridTableProps {
  columns: string[];
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onRemoveColumn: (column: string) => void;
  onSort: (sort: SortOrder[]) => void;
  rows: OpenSearchSearchHit[];
  onSetColumns: (columns: string[]) => void;
  sort: SortOrder[];
  displayTimeColumn: boolean;
  services: DiscoverServices;
  isToolbarVisible?: boolean;
}

export const DataGridTable = ({
  columns,
  indexPattern,
  onAddColumn,
  onFilter,
  onRemoveColumn,
  onSetColumns,
  onSort,
  sort,
  rows,
  displayTimeColumn,
  isToolbarVisible = true,
}: DataGridTableProps) => {
  const [expandedHit, setExpandedHit] = useState<OpenSearchSearchHit | undefined>();
  const rowCount = useMemo(() => (rows ? rows.length : 0), [rows]);
  const pagination = usePagination(rowCount);

  const sortingColumns = useMemo(() => sort.map(([id, direction]) => ({ id, direction })), [sort]);
  const rowHeightsOptions = useMemo(
    () => ({
      defaultHeight: {
        lineCount: columns.includes('_source') ? 3 : 1,
      },
    }),
    [columns]
  );

  const onColumnSort = useCallback(
    (cols: EuiDataGridSorting['columns']) => {
      onSort(cols.map(({ id, direction }) => [id, direction]));
    },
    [onSort]
  );

  const renderCellValue = useMemo(() => fetchTableDataCell(indexPattern, rows), [
    indexPattern,
    rows,
  ]);

  const dataGridTableColumns = useMemo(
    () => buildDataGridColumns(columns, indexPattern, displayTimeColumn),
    [columns, indexPattern, displayTimeColumn]
  );

  const dataGridTableColumnsVisibility = useMemo(
    () => ({
      visibleColumns: computeVisibleColumns(columns, indexPattern, displayTimeColumn) as string[],
      setVisibleColumns: (cols: string[]) => {
        onSetColumns(cols);
      },
    }),
    [columns, indexPattern, displayTimeColumn, onSetColumns]
  );

  const sorting: EuiDataGridSorting = useMemo(
    () => ({ columns: sortingColumns, onSort: onColumnSort }),
    [sortingColumns, onColumnSort]
  );

  const leadingControlColumns = useMemo(() => {
    return [
      {
        id: 'expandCollapseColumn',
        headerCellRender: () => null,
        rowCellRender: DocViewExpandButton,
        width: 40,
      },
    ];
  }, []);

  const table = useMemo(
    () => (
      <EuiDataGrid
        aria-labelledby="aria-labelledby"
        columns={dataGridTableColumns}
        columnVisibility={dataGridTableColumnsVisibility}
        leadingControlColumns={leadingControlColumns}
        data-test-subj="docTable"
        pagination={pagination}
        renderCellValue={renderCellValue}
        rowCount={rowCount}
        sorting={sorting}
        toolbarVisibility={isToolbarVisible ? toolbarVisibility : false}
        rowHeightsOptions={rowHeightsOptions}
      />
    ),
    [
      dataGridTableColumns,
      dataGridTableColumnsVisibility,
      leadingControlColumns,
      pagination,
      renderCellValue,
      rowCount,
      sorting,
      isToolbarVisible,
      rowHeightsOptions,
    ]
  );

  return (
    <DiscoverGridContextProvider
      value={{
        expandedHit,
        onFilter,
        setExpandedHit,
        rows: rows || [],
        indexPattern,
      }}
    >
      <>
        <EuiPanel hasBorder={false} hasShadow={false} paddingSize="s" color="transparent">
          <EuiPanel paddingSize="s" style={{ height: '100%' }}>
            {table}
          </EuiPanel>
        </EuiPanel>
        {expandedHit && (
          <DataGridFlyout
            indexPattern={indexPattern}
            hit={expandedHit}
            columns={columns}
            onRemoveColumn={onRemoveColumn}
            onAddColumn={onAddColumn}
            onFilter={onFilter}
            onClose={() => setExpandedHit(undefined)}
          />
        )}
      </>
    </DiscoverGridContextProvider>
  );
};
