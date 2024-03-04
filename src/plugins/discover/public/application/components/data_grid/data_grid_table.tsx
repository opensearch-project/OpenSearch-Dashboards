/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_data_grid_table.scss';

import React, { useState, useMemo, useCallback } from 'react';
import { EuiDataGrid, EuiDataGridSorting, EuiPanel } from '@elastic/eui';
import { IndexPattern, getServices } from '../../../opensearch_dashboards_services';
import { fetchTableDataCell } from './data_grid_table_cell_value';
import { buildDataGridColumns, computeVisibleColumns } from './data_grid_table_columns';
import { DocViewInspectButton } from './data_grid_table_docview_inspect_button';
import { DataGridFlyout } from './data_grid_table_flyout';
import { DiscoverGridContextProvider } from './data_grid_table_context';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { usePagination } from '../utils/use_pagination';
import { buildColumns } from '../../utils/columns';
import {
  DOC_HIDE_TIME_COLUMN_SETTING,
  SAMPLE_SIZE_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
} from '../../../../common';
import { UI_SETTINGS } from '../../../../../data/common';
import { LegacyDiscoverTable } from '../default_discover_table/default_discover_table';
import { getNewDiscoverSetting } from '../utils/local_storage';
import { SortDirection, SortOrder } from '../../../saved_searches/types';
import { useToolbarOptions } from './data_grid_toolbar';

export interface DataGridTableProps {
  columns: string[];
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onMoveColumn: (colName: string, destination: number) => void;
  onRemoveColumn: (column: string) => void;
  hits?: number;
  onSort: (s: SortOrder[]) => void;
  rows: OpenSearchSearchHit[];
  onSetColumns: (columns: string[]) => void;
  sort: SortOrder[];
  displayTimeColumn: boolean;
  title?: string;
  description?: string;
  isToolbarVisible?: boolean;
  isContextView?: boolean;
  isLoading?: boolean;
  showPagination?: boolean;
  scrollToTop?: () => void;
}

export const DataGridTable = ({
  columns,
  indexPattern,
  onAddColumn,
  onFilter,
  onMoveColumn,
  onRemoveColumn,
  onSetColumns,
  onSort,
  sort,
  hits,
  rows,
  displayTimeColumn,
  title = '',
  description = '',
  isToolbarVisible = true,
  isContextView = false,
  isLoading = false,
  showPagination,
  scrollToTop,
}: DataGridTableProps) => {
  const services = getServices();
  const [inspectedHit, setInspectedHit] = useState<OpenSearchSearchHit | undefined>();
  const rowCount = useMemo(() => (rows ? rows.length : 0), [rows]);
  const { toolbarOptions, lineCount } = useToolbarOptions();
  const [pageSizeLimit, isShortDots, hideTimeColumn, defaultSortOrder] = useMemo(() => {
    return [
      services.uiSettings.get(SAMPLE_SIZE_SETTING),
      services.uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
      services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING),
      services.uiSettings.get(SORT_DEFAULT_ORDER_SETTING, 'desc') as SortDirection,
    ];
  }, [services.uiSettings]);
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
        lineCount: lineCount || (includeSourceInColumns ? 3 : 1),
      },
    }),
    [includeSourceInColumns, lineCount]
  );

  const onColumnSort = useCallback(
    (cols: EuiDataGridSorting['columns']) => {
      onSort(cols.map(({ id, direction }) => [id, direction]));
    },
    [onSort]
  );

  const renderCellValue = useMemo(() => fetchTableDataCell(indexPattern, rows, isShortDots), [
    indexPattern,
    isShortDots,
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

  const newDiscoverEnabled = getNewDiscoverSetting(services.storage);

  const legacyDiscoverTable = useMemo(
    () => (
      <LegacyDiscoverTable
        columns={adjustedColumns}
        hits={hits}
        rows={rows}
        indexPattern={indexPattern}
        sort={sort}
        onSort={onSort}
        onRemoveColumn={onRemoveColumn}
        onMoveColumn={onMoveColumn}
        onAddColumn={onAddColumn}
        onFilter={onFilter}
        onClose={() => setInspectedHit(undefined)}
        sampleSize={pageSizeLimit}
        showPagination={showPagination}
        isShortDots={isShortDots}
        hideTimeColumn={hideTimeColumn}
        defaultSortOrder={defaultSortOrder}
        scrollToTop={scrollToTop}
      />
    ),
    [
      adjustedColumns,
      hits,
      rows,
      indexPattern,
      sort,
      onSort,
      onRemoveColumn,
      onMoveColumn,
      onAddColumn,
      onFilter,
      pageSizeLimit,
      showPagination,
      defaultSortOrder,
      hideTimeColumn,
      isShortDots,
      scrollToTop,
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
        toolbarVisibility={isToolbarVisible ? toolbarOptions : false}
        rowHeightsOptions={rowHeightsOptions}
        className="discoverDataGrid"
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
      toolbarOptions,
      rowHeightsOptions,
    ]
  );

  const tablePanelProps = newDiscoverEnabled
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
          {newDiscoverEnabled ? dataGridTable : legacyDiscoverTable}
        </EuiPanel>
        {newDiscoverEnabled && inspectedHit && (
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
