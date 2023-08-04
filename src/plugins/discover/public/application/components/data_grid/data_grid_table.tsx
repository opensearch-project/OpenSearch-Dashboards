/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { EuiDataGrid } from '@elastic/eui';
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

export interface DataGridTableProps {
  columns: string[];
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onRemoveColumn: (column: string) => void;
  onSort: (sort: string[][]) => void;
  rows: OpenSearchSearchHit[];
  onSetColumns: (columns: string[]) => void;
  sort: Array<[string, string]>;
  displayTimeColumn: boolean;
  services: DiscoverServices;
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
  services,
}: DataGridTableProps) => {
  const [expandedHit, setExpandedHit] = useState<OpenSearchSearchHit | undefined>();
  const rowCount = useMemo(() => (rows ? rows.length : 0), [rows]);
  const pagination = usePagination(rowCount);

  const sortingColumns = useMemo(() => sort.map(([id, direction]) => ({ id, direction })), [sort]);

  const onColumnSort = useCallback(
    (cols) => {
      onSort(cols.map(({ id, direction }: any) => [id, direction]));
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
      setVisibleColumns: (newColumns: string[]) => {
        onSetColumns(newColumns);
      },
    }),
    [columns, indexPattern, displayTimeColumn, onSetColumns]
  );

  const sorting = useMemo(() => ({ columns: sortingColumns, onSort: onColumnSort }), [
    sortingColumns,
    onColumnSort,
  ]);

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
          toolbarVisibility={toolbarVisibility}
        />
        {expandedHit && (
          <DataGridFlyout
            indexPattern={indexPattern}
            hit={expandedHit}
            columns={columns}
            onRemoveColumn={onRemoveColumn}
            onAddColumn={onAddColumn}
            onFilter={onFilter}
            onClose={() => setExpandedHit(undefined)}
            services={services}
          />
        )}
      </>
    </DiscoverGridContextProvider>
  );
};
