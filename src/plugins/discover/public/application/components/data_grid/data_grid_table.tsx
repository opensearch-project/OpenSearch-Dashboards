/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { EuiDataGrid, EuiDataGridSorting, EuiPanel } from '@elastic/eui';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { fetchTableDataCell } from './data_grid_table_cell_value';
import { buildDataGridColumns, computeVisibleColumns } from './data_grid_table_columns';
import { DocViewInspectButton } from './data_grid_table_docview_inspect_button';
import { DataGridFlyout } from './data_grid_table_flyout';
import { DiscoverGridContextProvider } from './data_grid_table_context';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { usePagination } from '../utils/use_pagination';
import { SortOrder } from '../../../saved_searches/types';
import { buildColumns } from '../../utils/columns';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { SAMPLE_SIZE_SETTING } from '../../../../common';
import { LegacyDiscoverTable } from '../default_discover_table/default_discover_table';
import { toolbarVisibility } from './constants';
import { getDataGridTableSetting } from '../utils/local_storage';
import { Storage } from '../../../../../opensearch_dashboards_utils/public';

export interface DataGridTableProps {
  columns: string[];
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onRemoveColumn: (column: string) => void;
  onReorderColumn: (col: string, source: number, destination: number) => void;
  onSort: (sort: SortOrder[]) => void;
  rows: OpenSearchSearchHit[];
  onSetColumns: (columns: string[]) => void;
  sort: SortOrder[];
  displayTimeColumn: boolean;
  title?: string;
  description?: string;
  isToolbarVisible?: boolean;
  isContextView?: boolean;
  isLoading?: boolean;
  storage: Storage;
}

export const DataGridTable = ({
  columns,
  indexPattern,
  onAddColumn,
  onFilter,
  onRemoveColumn,
  onReorderColumn,
  onSetColumns,
  onSort,
  sort,
  rows,
  displayTimeColumn,
  title = '',
  description = '',
  isToolbarVisible = true,
  isContextView = false,
  isLoading = false,
  storage,
}: DataGridTableProps) => {
  const { services } = useOpenSearchDashboards<DiscoverServices>();

  const [inspectedHit, setInspectedHit] = useState<OpenSearchSearchHit | undefined>();
  const rowCount = useMemo(() => (rows ? rows.length : 0), [rows]);
  const pageSizeLimit = services.uiSettings?.get(SAMPLE_SIZE_SETTING);
  const pagination = usePagination({ rowCount, pageSizeLimit });

  let adjustedColumns = buildColumns(columns);
  // handle case where the user removes selected filed and leaves only time column
  if (
    adjustedColumns.length === 1 &&
    indexPattern &&
    adjustedColumns[0] === indexPattern.timeFieldName
  ) {
    adjustedColumns = [...adjustedColumns, '_source'];
  }

  const includeSourceInColumns = adjustedColumns.includes('_source');
  const sortingColumns = useMemo(() => sort.map(([id, direction]) => ({ id, direction })), [sort]);
  const rowHeightsOptions = useMemo(
    () => ({
      defaultHeight: {
        lineCount: adjustedColumns.includes('_source') ? 3 : 1,
      },
    }),
    [adjustedColumns]
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

  const displayedTableColumns = useMemo(
    () =>
      buildDataGridColumns(
        adjustedColumns,
        indexPattern,
        displayTimeColumn,
        includeSourceInColumns,
        isContextView
      ),
    [adjustedColumns, indexPattern, displayTimeColumn, includeSourceInColumns, isContextView]
  );

  const dataGridTableColumnsVisibility = useMemo(
    () => ({
      visibleColumns: computeVisibleColumns(
        adjustedColumns,
        indexPattern,
        displayTimeColumn
      ) as string[],
      setVisibleColumns: (cols: string[]) => {
        onSetColumns(cols);
      },
    }),
    [adjustedColumns, indexPattern, displayTimeColumn, onSetColumns]
  );

  const sorting: EuiDataGridSorting = useMemo(
    () => ({ columns: sortingColumns, onSort: onColumnSort }),
    [sortingColumns, onColumnSort]
  );

  const leadingControlColumns = useMemo(() => {
    return [
      {
        id: 'inspectCollapseColumn',
        headerCellRender: () => null,
        rowCellRender: DocViewInspectButton,
        width: 40,
      },
    ];
  }, []);

  const datagridActive = getDataGridTableSetting(storage);

  const legacyDiscoverTable = useMemo(
    () => (
      <LegacyDiscoverTable
        displayedTableColumns={displayedTableColumns}
        columns={adjustedColumns}
        rows={rows}
        indexPattern={indexPattern}
        sortOrder={sortingColumns}
        onChangeSortOrder={onColumnSort}
        onRemoveColumn={onRemoveColumn}
        onReorderColumn={onReorderColumn}
        onAddColumn={onAddColumn}
        onFilter={onFilter}
        onClose={() => setInspectedHit(undefined)}
      />
    ),
    [
      displayedTableColumns,
      adjustedColumns,
      indexPattern,
      onAddColumn,
      onColumnSort,
      onFilter,
      onRemoveColumn,
      onReorderColumn,
      rows,
      sortingColumns,
    ]
  );

  const dataGridTable = useMemo(
    () => (
      <EuiDataGrid
        aria-labelledby="aria-labelledby"
        columns={displayedTableColumns}
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
      displayedTableColumns,
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

  const tablePanelProps = datagridActive
    ? {
        paddingSize: 'none' as const,
        style: {
          margin: '8px',
        },
        color: 'transparent' as const,
      }
    : {
        paddingSize: 'none' as const,
        style: {
          margin: '0px',
          marginLeft: '8px',
        },
        color: 'transparent' as const,
      };

  return (
    <DiscoverGridContextProvider
      value={{
        inspectedHit,
        onFilter,
        setInspectedHit,
        rows: rows || [],
        indexPattern,
      }}
    >
      <div
        data-render-complete={!isLoading}
        data-shared-item=""
        data-title={title}
        data-description={description}
        data-test-subj="discoverTable"
        className="eui-xScrollWithShadows"
      >
        <EuiPanel hasBorder={false} hasShadow={false} {...tablePanelProps}>
          {datagridActive ? dataGridTable : legacyDiscoverTable}
        </EuiPanel>
        {datagridActive && inspectedHit && (
          <DataGridFlyout
            indexPattern={indexPattern}
            hit={inspectedHit}
            columns={adjustedColumns}
            onRemoveColumn={onRemoveColumn}
            onAddColumn={onAddColumn}
            onFilter={onFilter}
            onClose={() => setInspectedHit(undefined)}
          />
        )}
      </div>
    </DiscoverGridContextProvider>
  );
};
